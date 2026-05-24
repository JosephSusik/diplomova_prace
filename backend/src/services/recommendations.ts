/**
 * Book recommendation service
 *
 * Implements a hybrid recommendation algorithm:
 * 1. Item-based collaborative filtering (primary) - "users who have your books also have..."
 * 2. Content-based filtering (fallback) - same genres/authors as user's library
 * 3. Popularity-based (last resort) - most-owned or recently added books
 */

import { prisma } from "../db";
import { bookSelect, BookResponse, serializeBooks } from "../selects/book";
import type { Prisma } from "@prisma/client";
import { BookGenre } from "@prisma/client";

/**
 * Get personalized book recommendations for a user.
 * Uses item-based collaborative filtering first, then content-based, then popularity.
 *
 * @param userId - Authenticated user's ID
 * @param limit - Max number of recommendations (default 12, max 24)
 * @returns Array of recommended books in bookSelect format
 */
export async function getRecommendedBooks(
  userId: string,
  limit: number = 12
): Promise<BookResponse[]> {
  const cappedLimit = Math.min(Math.max(limit, 1), 24);

  // --- Step 1: Load user's library ---
  const userLibrary = await prisma.userLibrary.findMany({
    where: { userId },
    select: {
      book: {
        select: {
          id: true,
          genres: true,
          authors: true,
          libraryEntries: { select: { userId: true } },
        },
      },
    },
  });
  const userBooks = userLibrary.map((entry) => entry.book);
  const userBookIds = userBooks.map((b) => b.id);

  // --- Step 2: Item-based collaborative filtering ---
  // Find "similar users" = users who share at least one book with this user (excluding self)
  const similarUserIds = new Set<string>();
  for (const book of userBooks) {
    for (const entry of book.libraryEntries) {
      if (entry.userId !== userId) similarUserIds.add(entry.userId);
    }
  }

  let recommended: BookResponse[] = [];

  if (similarUserIds.size > 0) {
    // Get candidate books: owned by similar users, not in user's library
    // Include filtered libraryEntries so we can use its length as co-occurrence score
    const candidates = await prisma.book.findMany({
      where: {
        id: { notIn: userBookIds },
        libraryEntries: { some: { userId: { in: Array.from(similarUserIds) } } },
      },
      select: {
        ...bookSelect,
        // Override libraryEntries to only similar users for scoring; we'll restore full list later
        libraryEntries: {
          where: { userId: { in: Array.from(similarUserIds) } },
          select: {
            status: true,
            createdAt: true,
            user: { select: { id: true, name: true, surname: true } },
          },
        },
      },
    });

    // Sort by co-occurrence score (how many similar users have this book), then by recency
    const scored = candidates
      .map((b) => ({ book: b, score: b.libraryEntries.length }))
      .filter((x) => x.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const aDate = a.book.created_at ? new Date(a.book.created_at).getTime() : 0;
        const bDate = b.book.created_at ? new Date(b.book.created_at).getTime() : 0;
        return bDate - aDate; // newer first
      })
      .slice(0, cappedLimit);

    // Fetch full book data (with complete library membership) for response
    if (scored.length > 0) {
      const ids = scored.map((s) => s.book.id);
      const fullBooks = await prisma.book.findMany({
        where: { id: { in: ids } },
        select: bookSelect,
      });
      // Preserve collaborative filtering order
      const idToOrder = Object.fromEntries(ids.map((id, i) => [id, i]));
      recommended = serializeBooks(
        fullBooks.sort((a, b) => (idToOrder[a.id] ?? 999) - (idToOrder[b.id] ?? 999)),
        userId,
      );
    }
  }

  // --- Step 3: Content-based fallback / top-up ---
  // Only run when we have genre/author preferences and still need more recommendations
  if (recommended.length < cappedLimit) {
    const userGenres = new Set<string>();
    const userAuthors = new Set<string>();
    for (const b of userBooks) {
      b.genres?.forEach((g) => userGenres.add(g));
      b.authors?.forEach((a) => userAuthors.add(a));
    }

    const excludeIds = [...userBookIds, ...recommended.map((b) => b.id)];
    const contentWhere: Prisma.BookWhereInput = { id: { notIn: excludeIds } };
    // Add genre/author filter only when we have preferences (empty OR would match nothing).
    // When both are empty, we still run this query—it returns recent books, effectively
    // acting as an extra popularity fill before Step 4.
    if (userGenres.size > 0 || userAuthors.size > 0) {
      contentWhere.OR = [
        ...(userGenres.size > 0 ? [{ genres: { hasSome: Array.from(userGenres) as BookGenre[] } }] : []),
        ...(userAuthors.size > 0 ? [{ authors: { hasSome: Array.from(userAuthors) } }] : []),
      ];
    }

    const contentBased = await prisma.book.findMany({
      where: contentWhere,
      select: bookSelect,
      orderBy: { created_at: "desc" },
      take: cappedLimit - recommended.length,
    });
    recommended = [...recommended, ...serializeBooks(contentBased, userId)];
  }

  // --- Step 4: Popularity-based top-up ---
  if (recommended.length < cappedLimit) {
    const excludeIds = [...userBookIds, ...recommended.map((b) => b.id)];
    const popular = await prisma.book.findMany({
      where: { id: { notIn: excludeIds } },
      select: bookSelect,
      orderBy: { created_at: "desc" },
      take: cappedLimit - recommended.length,
    });
    recommended = [...recommended, ...serializeBooks(popular, userId)];
  }

  return recommended;
}
