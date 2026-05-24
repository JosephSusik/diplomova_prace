// src/routes/books.ts
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import { BookGenre, LibraryStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../db";
import { bookSelect, serializeBook, serializeBooks } from "../selects/book";
import { getRecommendedBooks } from "../services/recommendations";
import { scanBarcodeFromBuffer, isSupportedImageFile } from "../services/barcode";
import {
  BookLookupData,
  fetchGoogleBookByIsbn,
  fetchOpenLibraryBooksByIsbn,
  lookupBookByIsbnWithFallback,
  normalizeIsbnInput,
  parseOptionalDate,
} from "../services/bookLookup";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Invalid token" });

    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role?: string;
    };
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
};

const isAdmin = (req: AuthRequest) => req.userRole === UserRole.Admin;

function ensureCanAccessUser(req: AuthRequest, res: Response, userId: string): boolean {
  if (req.userId === userId || isAdmin(req)) return true;
  res.status(403).json({ error: "You can access only your own library" });
  return false;
}

const ALLOWED_GENRES = new Set<string>(Object.values(BookGenre));

function parseGenres(raw: unknown): BookGenre[] {
  if (!Array.isArray(raw)) return [];
  return Array.from(
    new Set(
      raw
        .map((genre) => String(genre))
        .filter((genre): genre is BookGenre => ALLOWED_GENRES.has(genre)),
    ),
  );
}

function normalizeLibraryStatus(raw: unknown): LibraryStatus | null {
  return raw === LibraryStatus.READ || raw === LibraryStatus.TO_READ
    ? raw
    : null;
}

function routeParam(req: AuthRequest, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

async function fetchSerializedBook(bookId: string, currentUserId: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: bookSelect,
  });
  return book ? serializeBook(book, currentUserId) : null;
}

async function createBookFromLookupData(
  userId: string,
  bookData: BookLookupData,
): Promise<{ id: string; title: string }> {
  return prisma.book.create({
    data: {
      ...bookData,
      created_by_id: userId,
      libraryEntries: { create: { userId } },
    },
    select: { id: true, title: true },
  });
}

function externalLookupMissMessage(googleBooksQuotaExceeded = false): string {
  return googleBooksQuotaExceeded
    ? "Book lookup could not find metadata after the Google Books quota was reached. Add it manually."
    : "Book not found in external metadata sources";
}

// GET /books/all - all books in the catalog
router.get("/all", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const books = await prisma.book.findMany({
      select: bookSelect,
      orderBy: { created_at: "desc" },
    });
    res.json(serializeBooks(books, req.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// GET /books/recommended - personalized book recommendations (requires auth)
// Uses hybrid algorithm: item-based collaborative filtering → content-based → popularity
router.get("/recommended", authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const limit = Math.min(parseInt(req.query.limit as string) || 12, 24);

  try {
    const recommended = await getRecommendedBooks(userId, limit);
    res.json(recommended);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

// GET /books/createdBy/:userId - books added by a specific user
router.get("/createdBy/:userId", authenticateToken, async (req: AuthRequest, res) => {
  const userId = routeParam(req, "userId");
  if (!ensureCanAccessUser(req, res, userId)) return;

  try {
    const books = await prisma.book.findMany({
      where: { created_by_id: userId },
      select: bookSelect,
      orderBy: { created_at: "desc" },
    });
    res.json(serializeBooks(books, req.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch books created by user" });
  }
});

// GET /books/by-id/:id - single book by ID
router.get("/by-id/:id", authenticateToken, async (req: AuthRequest, res) => {
  const id = routeParam(req, "id");
  try {
    const book = await prisma.book.findUnique({
      where: { id },
      select: bookSelect,
    });
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json(serializeBook(book, req.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch book" });
  }
});

// POST /books/:bookId/library - add existing catalog book to authenticated user's library
router.post("/:bookId/library", authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const bookId = routeParam(req, "bookId");
  const status = normalizeLibraryStatus(req.body?.status) ?? LibraryStatus.TO_READ;

  try {
    const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true } });
    if (!book) return res.status(404).json({ error: "Book not found" });

    const existing = await prisma.userLibrary.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (!existing) {
      await prisma.userLibrary.create({
        data: { userId, bookId, status },
      });
    }

    const serialized = await fetchSerializedBook(bookId, userId);
    res.status(existing ? 200 : 201).json({
      message: existing ? "Book already in library" : "Book added to library",
      book: serialized,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add book to library" });
  }
});

// PATCH /books/:bookId/library - update status in authenticated user's library
router.patch("/:bookId/library", authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const bookId = routeParam(req, "bookId");
  const status = normalizeLibraryStatus(req.body?.status);

  if (!status) {
    return res.status(400).json({ error: "status must be TO_READ or READ" });
  }

  try {
    const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true } });
    if (!book) return res.status(404).json({ error: "Book not found" });

    const existing = await prisma.userLibrary.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    if (!existing) {
      return res.status(404).json({ error: "Book is not in your library" });
    }

    await prisma.userLibrary.update({
      where: { userId_bookId: { userId, bookId } },
      data: { status },
    });

    const serialized = await fetchSerializedBook(bookId, userId);
    res.json({ message: "Library status updated", book: serialized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update library status" });
  }
});

// DELETE /books/:bookId/library - remove book from authenticated user's library
router.delete("/:bookId/library", authenticateToken, async (req: AuthRequest, res) => {
  const bookId = routeParam(req, "bookId");
  const requestedTargetUserId =
    typeof req.query.userId === "string" ? req.query.userId : undefined;
  const targetUserId = requestedTargetUserId ?? req.userId!;

  if (requestedTargetUserId && requestedTargetUserId !== req.userId && !isAdmin(req)) {
    return res.status(403).json({ error: "You can remove only your own books" });
  }

  try {
    const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true } });
    if (!book) return res.status(404).json({ error: "Book not found" });

    const existing = await prisma.userLibrary.findUnique({
      where: { userId_bookId: { userId: targetUserId, bookId } },
    });
    if (!existing) {
      return res.status(403).json({ error: "Book is not in this library" });
    }

    await prisma.userLibrary.delete({
      where: { userId_bookId: { userId: targetUserId, bookId } },
    });

    res.json({ message: "Book removed from library" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove book from library" });
  }
});

// POST /books/scan-barcode - Scan barcode from uploaded image, return ISBN
router.post(
  "/scan-barcode",
  authenticateToken,
  upload.single("image"),
  async (req: AuthRequest, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided. Use multipart field 'image'." });
    }
    if (!isSupportedImageFile(req.file.originalname)) {
      return res.status(400).json({
        error: "Unsupported image format. Use JPEG, PNG, GIF, or HEIC.",
      });
    }
    try {
      const isbn = await scanBarcodeFromBuffer(
        req.file.buffer,
        req.file.originalname,
      );
      if (!isbn) {
        return res.status(422).json({
          error: "Could not detect barcode/ISBN in the image. Try a clearer photo.",
        });
      }
      res.json({ ISBN: isbn });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to scan barcode" });
    }
  },
);

// POST /books/batch-add - Add multiple books by ISBN
router.post("/batch-add", authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { isbns } = req.body;

  if (!isbns || !Array.isArray(isbns) || isbns.length === 0) {
    return res.status(400).json({ error: "isbns array is required" });
  }

  const normalizedIsbns = Array.from(
    new Set(isbns.map(normalizeIsbnInput).filter((s): s is string => Boolean(s))),
  );

  if (normalizedIsbns.length === 0) {
    return res.status(400).json({ error: "No valid ISBNs provided" });
  }

  type BatchResult = { isbn: string; success: boolean; error?: string };
  const resultsByIsbn = new Map<string, BatchResult>();
  const openLibraryFallbackIsbns: string[] = [];
  const googleQuotaExceededIsbns = new Set<string>();

  for (const isbn of normalizedIsbns) {
    try {
      let book = await prisma.book.findUnique({
        where: { ISBN: isbn },
        select: { id: true, title: true },
      });

      if (!book) {
        const googleResult = await fetchGoogleBookByIsbn(isbn);
        if (googleResult.googleBooksQuotaExceeded) {
          googleQuotaExceededIsbns.add(isbn);
        }

        if (googleResult.book) {
          await createBookFromLookupData(userId, googleResult.book);
          resultsByIsbn.set(isbn, { isbn, success: true });
          continue;
        }

        openLibraryFallbackIsbns.push(isbn);
        continue;
      }

      const existingEntry = await prisma.userLibrary.findUnique({
        where: { userId_bookId: { userId, bookId: book.id } },
      });

      if (existingEntry) {
        resultsByIsbn.set(isbn, { isbn, success: false, error: "Already in your library" });
        continue;
      }

      await prisma.userLibrary.create({
        data: { userId, bookId: book.id },
      });
      await prisma.book.update({
        where: { id: book.id },
        data: { updated_at: new Date() },
      });
      resultsByIsbn.set(isbn, { isbn, success: true });
    } catch (err) {
      resultsByIsbn.set(isbn, {
        isbn,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  if (openLibraryFallbackIsbns.length > 0) {
    const openLibraryBooks = await fetchOpenLibraryBooksByIsbn(openLibraryFallbackIsbns);

    for (const isbn of openLibraryFallbackIsbns) {
      const bookData = openLibraryBooks.get(isbn);
      if (!bookData) {
        resultsByIsbn.set(isbn, {
          isbn,
          success: false,
          error: externalLookupMissMessage(googleQuotaExceededIsbns.has(isbn)),
        });
        continue;
      }

      try {
        await createBookFromLookupData(userId, bookData);
        resultsByIsbn.set(isbn, { isbn, success: true });
      } catch (err) {
        resultsByIsbn.set(isbn, {
          isbn,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  }

  const results = normalizedIsbns.map(
    (isbn) =>
      resultsByIsbn.get(isbn) ?? {
        isbn,
        success: false,
        error: "Unknown error",
      },
  );
  const succeeded = results.filter((r) => r.success).length;
  res.json({
    message: `Added ${succeeded} of ${results.length} books`,
    results,
  });
});

// POST /books/search-by-isbn - Search for book by ISBN
router.post("/search-by-isbn", authenticateToken, async (req: AuthRequest, res) => {
  const rawIsbn = req.body.ISBN;
  const userId = req.userId!;
  const ISBN = normalizeIsbnInput(rawIsbn);

  if (!ISBN) {
    return res.status(400).json({
      error: "ISBN musí mít 10 znaků (včetně X) nebo 13 číslic.",
    });
  }

  try {
    const existingBook = await prisma.book.findUnique({
      where: { ISBN },
      include: {
        libraryEntries: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    if (existingBook) {
      const isInUserLibrary = existingBook.libraryEntries.length > 0;

      if (!isInUserLibrary) {
        return res.json({
          source: "database",
          book: {
            id: existingBook.id,
            ISBN: existingBook.ISBN,
            title: existingBook.title,
            subtitle: existingBook.subtitle || undefined,
            authors: existingBook.authors,
            publisher: existingBook.publisher || undefined,
            published_date: existingBook.published_date || undefined,
            page_count: existingBook.page_count || undefined,
            language: existingBook.language || undefined,
            genres: existingBook.genres,
            description: existingBook.description || undefined,
            cover_url: existingBook.cover_url || undefined,
          },
          disabledFields: [
            "ISBN",
            "title",
            "subtitle",
            "authors",
            "publisher",
            "published_date",
            "page_count",
            "language",
            "genres",
            "description",
            "cover_url",
          ],
        });
      }

      return res.status(400).json({ error: "Book already in your library" });
    }

    const lookup = await lookupBookByIsbnWithFallback(ISBN);
    return res.json({
      source: lookup.source,
      book: lookup.book,
      disabledFields: [],
      ...(lookup.googleBooksQuotaExceeded
        ? { googleBooksQuotaExceeded: true }
        : {}),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search for book" });
  }
});

// POST /books - Create or update a book
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const {
    ISBN: rawISBN,
    title,
    subtitle,
    authors,
    publisher,
    published_date,
    page_count,
    language,
    genres,
    description,
    cover_url,
  } = req.body;

  const ISBN = rawISBN ? normalizeIsbnInput(rawISBN) : null;
  if (rawISBN && !ISBN) {
    return res.status(400).json({ error: "ISBN must be 10 or 13 characters" });
  }

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const parsedGenres = parseGenres(genres);
  const authorsList = Array.isArray(authors)
    ? authors.map((author) => String(author).trim()).filter(Boolean)
    : [];

  try {
    let book: { id: string } | null = null;
    if (ISBN) {
      book = await prisma.book.findUnique({
        where: { ISBN },
        select: { id: true },
      });
    }

    if (book) {
      const existingEntry = await prisma.userLibrary.findUnique({
        where: { userId_bookId: { userId, bookId: book.id } },
      });

      if (!existingEntry) {
        await prisma.userLibrary.create({
          data: { userId, bookId: book.id },
        });
      }

      const updateData: Prisma.BookUpdateInput = {
        updated_at: new Date(),
      };
      if (typeof description === "string" && description.trim()) {
        updateData.description = description.trim();
      }
      if (typeof cover_url === "string" && cover_url.trim()) {
        updateData.cover_url = cover_url.trim();
      }
      if (Array.isArray(genres)) {
        updateData.genres = { set: parsedGenres };
      }

      await prisma.book.update({
        where: { id: book.id },
        data: updateData,
      });

      const updatedBook = await fetchSerializedBook(book.id, userId);
      return res.status(existingEntry ? 200 : 201).json({
        message: existingEntry ? "Book updated" : "Book added to library",
        book: updatedBook,
      });
    }

    const newBook = await prisma.book.create({
      data: {
        ISBN: ISBN || undefined,
        title,
        subtitle: subtitle || undefined,
        authors: authorsList,
        publisher: publisher || undefined,
        published_date: parseOptionalDate(published_date),
        page_count: page_count || undefined,
        language: language || undefined,
        genres: parsedGenres,
        description: description || undefined,
        cover_url: cover_url || undefined,
        created_by_id: userId,
        libraryEntries: {
          create: { userId },
        },
      },
      select: bookSelect,
    });

    return res.status(201).json({
      message: "Book created",
      book: serializeBook(newBook, userId),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create/update book" });
  }
});

// GET /books/:userId - books that a user has in library
router.get("/:userId", authenticateToken, async (req: AuthRequest, res) => {
  const userId = routeParam(req, "userId");
  if (!ensureCanAccessUser(req, res, userId)) return;

  try {
    const entries = await prisma.userLibrary.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { book: { select: bookSelect } },
    });
    res.json(entries.map((entry) => serializeBook(entry.book, req.userId)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user's books" });
  }
});

export default router;
