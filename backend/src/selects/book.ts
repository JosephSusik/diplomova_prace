// src/constants/bookSelect.ts
import { Prisma } from "@prisma/client";

export const bookSelect = {
  id: true,
  ISBN: true,
  title: true,
  subtitle: true,
  publisher: true,
  published_date: true,
  page_count: true,
  language: true,
  description: true,
  cover_url: true,
  created_at: true,
  updated_at: true,
  genres: true,
  authors: true, // now a string array
  // Relations
  created_by: {
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
    },
  },
  libraryEntries: {
    select: {
      status: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          surname: true,
        },
      },
    },
  },
} satisfies Prisma.BookSelect;

export type BookPayload = Prisma.BookGetPayload<{ select: typeof bookSelect }>;

export type BookResponse = Omit<BookPayload, "libraryEntries"> & {
  addedByUsers: BookPayload["libraryEntries"][number]["user"][];
  libraryStatus: BookPayload["libraryEntries"][number]["status"] | null;
  added_at: Date | null;
};

export function serializeBook(
  book: BookPayload,
  currentUserId?: string | null,
): BookResponse {
  const { libraryEntries, ...rest } = book;
  const currentEntry = currentUserId
    ? libraryEntries.find((entry) => entry.user.id === currentUserId)
    : undefined;

  return {
    ...rest,
    addedByUsers: libraryEntries.map((entry) => entry.user),
    libraryStatus: currentEntry?.status ?? null,
    added_at: currentEntry?.createdAt ?? null,
  };
}

export function serializeBooks(
  books: BookPayload[],
  currentUserId?: string | null,
): BookResponse[] {
  return books.map((book) => serializeBook(book, currentUserId));
}
