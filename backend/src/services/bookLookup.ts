import { BookGenre } from "@prisma/client";

export type ExternalBookSource = "google_books" | "open_library";
export type BookLookupSource = ExternalBookSource | "manual";

export interface BookLookupData {
  ISBN: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  published_date?: Date;
  page_count?: number;
  language?: string;
  genres: BookGenre[];
  description?: string;
  cover_url?: string;
}

export type BookLookupResult =
  | {
      source: ExternalBookSource;
      book: BookLookupData;
      googleBooksQuotaExceeded?: boolean;
    }
  | {
      source: "manual";
      book: { ISBN: string };
      googleBooksQuotaExceeded?: boolean;
    };

interface SourceLookupResult {
  book: BookLookupData | null;
  googleBooksQuotaExceeded?: boolean;
}

class BookLookupRequestError extends Error {
  readonly source: ExternalBookSource;
  readonly status?: number;

  constructor(source: ExternalBookSource, message: string, status?: number) {
    super(message);
    this.name = "BookLookupRequestError";
    this.source = source;
    this.status = status;
  }
}

interface GoogleVolumeInfo {
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  language?: string;
  description?: string;
  categories?: string[];
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
}

interface GoogleBooksResponse {
  totalItems?: number;
  items?: { volumeInfo?: GoogleVolumeInfo }[];
}

interface OpenLibrarySearchDoc {
  title?: string;
  subtitle?: string;
  author_name?: string[];
  publisher?: string[];
  publish_date?: string[];
  publish_year?: number[];
  first_publish_year?: number;
  language?: string[];
  subject?: string[];
  cover_i?: number;
  cover_edition_key?: string;
  isbn?: string[];
  editions?: {
    docs?: OpenLibrarySearchDoc[];
  };
}

interface OpenLibrarySearchResponse {
  docs?: OpenLibrarySearchDoc[];
}

const openLibraryCache = new Map<string, BookLookupData | null>();

export function normalizeIsbnInput(raw: unknown): string | null {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^0-9X]/g, "");
  if (/^[0-9]{13}$/.test(s)) return s;
  if (/^[0-9]{9}[0-9X]$/.test(s)) return s;
  return null;
}

export function parseOptionalDate(raw: unknown): Date | undefined {
  if (!raw) return undefined;
  const date = new Date(String(raw));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function googleBooksVolumesUrl(isbn: string): string {
  const q = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`;
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  return key ? `${q}&key=${encodeURIComponent(key)}` : q;
}

function openLibraryUserAgent(): string {
  const contact = process.env.OPEN_LIBRARY_CONTACT_EMAIL?.trim();
  return contact ? `Bookly/1.0 (${contact})` : "Bookly/1.0";
}

function openLibrarySearchUrl(isbn: string): string {
  const params = new URLSearchParams({
    isbn,
    fields: [
      "key",
      "title",
      "subtitle",
      "author_name",
      "publisher",
      "publish_date",
      "publish_year",
      "first_publish_year",
      "language",
      "subject",
      "cover_i",
      "cover_edition_key",
      "isbn",
      "editions",
    ].join(","),
    limit: "10",
  });
  return `https://openlibrary.org/search.json?${params.toString()}`;
}

async function parseJsonResponse<T>(
  source: ExternalBookSource,
  response: Response,
): Promise<T> {
  const bodyText = await response.text();
  if (!response.ok) {
    const snippet = bodyText.slice(0, 500);
    if (source === "google_books" && response.status === 429) {
      console.warn("Google Books API: HTTP 429.", snippet);
    } else {
      console.error(`${source} HTTP error:`, response.status, snippet);
    }
    throw new BookLookupRequestError(
      source,
      `${source} request failed (${response.status})`,
      response.status,
    );
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    console.error(`${source} response was not JSON:`, bodyText.slice(0, 300));
    throw new BookLookupRequestError(
      source,
      `${source} returned invalid JSON`,
    );
  }
}

async function requestGoogleBooks(isbn: string): Promise<GoogleBooksResponse> {
  const response = await fetch(googleBooksVolumesUrl(isbn), {
    headers: { Accept: "application/json" },
  });
  return parseJsonResponse<GoogleBooksResponse>("google_books", response);
}

async function requestOpenLibrarySearch(
  isbn: string,
): Promise<OpenLibrarySearchResponse> {
  const response = await fetch(openLibrarySearchUrl(isbn), {
    headers: {
      Accept: "application/json",
      "User-Agent": openLibraryUserAgent(),
    },
  });
  return parseJsonResponse<OpenLibrarySearchResponse>("open_library", response);
}

const EXTERNAL_CATEGORY_TO_GENRE: [RegExp, BookGenre][] = [
  [/science fiction|sci-fi|dystopian/i, BookGenre.SciFi],
  [/fantasy|magic|wizard|witch/i, BookGenre.Fantasy],
  [/mystery|detective|crime/i, BookGenre.Mystery],
  [/romance|love/i, BookGenre.Romance],
  [/thriller|suspense/i, BookGenre.Thriller],
  [/biography|autobiography|memoir/i, BookGenre.Biography],
  [/history|historical/i, BookGenre.History],
  [/self-help|self help|personal growth/i, BookGenre.SelfHelp],
  [/juvenile|children|young adult/i, BookGenre.Children],
  [/adventure/i, BookGenre.Adventure],
  [/horror/i, BookGenre.Horror],
  [/classic/i, BookGenre.Classics],
  [/poetry|poems/i, BookGenre.Poetry],
  [/comic|graphic novel|manga/i, BookGenre.GraphicNovel],
  [
    /nonfiction|non-fiction|business|education|science|technology/i,
    BookGenre.NonFiction,
  ],
  [/fiction|literature|novel/i, BookGenre.Fiction],
];

function mapExternalCategoriesToGenres(categories?: string[]): BookGenre[] {
  const mapped = new Set<BookGenre>();
  for (const category of categories ?? []) {
    for (const [pattern, genre] of EXTERNAL_CATEGORY_TO_GENRE) {
      if (pattern.test(category)) mapped.add(genre);
    }
  }
  return Array.from(mapped);
}

function firstString(values?: string[]): string | undefined {
  return values?.find((value) => value.trim())?.trim();
}

function openLibrarySearchDocHasIsbn(
  doc: OpenLibrarySearchDoc,
  isbn: string,
): boolean {
  return Boolean(
    doc.isbn?.some((rawIsbn) => normalizeIsbnInput(rawIsbn) === isbn),
  );
}

function mergeOpenLibrarySearchDoc(
  workDoc: OpenLibrarySearchDoc,
  editionDoc?: OpenLibrarySearchDoc,
): OpenLibrarySearchDoc {
  if (!editionDoc) return workDoc;
  return {
    ...workDoc,
    ...editionDoc,
    subject: editionDoc.subject ?? workDoc.subject,
    editions: workDoc.editions,
  };
}

function selectOpenLibrarySearchDoc(
  isbn: string,
  docs?: OpenLibrarySearchDoc[],
): OpenLibrarySearchDoc | null {
  if (!Array.isArray(docs) || docs.length === 0) return null;

  const isbnMatchingDocs = docs.filter((doc) =>
    openLibrarySearchDocHasIsbn(doc, isbn),
  );
  const candidates = isbnMatchingDocs.length > 0 ? isbnMatchingDocs : docs;

  for (const doc of candidates) {
    const exactEdition = doc.editions?.docs?.find((edition) =>
      openLibrarySearchDocHasIsbn(edition, isbn),
    );
    return mergeOpenLibrarySearchDoc(doc, exactEdition);
  }

  return null;
}

function buildBookDataFromGoogle(
  isbn: string,
  vi: GoogleVolumeInfo,
): BookLookupData {
  return {
    ISBN: isbn,
    title: vi.title || "Unknown",
    subtitle: vi.subtitle || undefined,
    authors: vi.authors || [],
    publisher: vi.publisher || undefined,
    published_date: parseOptionalDate(vi.publishedDate),
    page_count: vi.pageCount || undefined,
    language: vi.language || undefined,
    genres: mapExternalCategoriesToGenres(vi.categories),
    description: vi.description || undefined,
    cover_url:
      vi.imageLinks?.thumbnail || vi.imageLinks?.smallThumbnail || undefined,
  };
}

function buildBookDataFromOpenLibrarySearch(
  isbn: string,
  doc: OpenLibrarySearchDoc,
): BookLookupData {
  const publishedDate =
    firstString(doc.publish_date) ||
    doc.first_publish_year?.toString() ||
    doc.publish_year?.[0]?.toString();

  return {
    ISBN: isbn,
    title: doc.title || "Unknown",
    subtitle: doc.subtitle || undefined,
    authors: doc.author_name || [],
    publisher: firstString(doc.publisher),
    published_date: parseOptionalDate(publishedDate),
    language: firstString(doc.language),
    genres: mapExternalCategoriesToGenres(doc.subject),
    cover_url: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false`
      : doc.cover_edition_key
        ? `https://covers.openlibrary.org/b/olid/${encodeURIComponent(doc.cover_edition_key)}-L.jpg?default=false`
        : `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg?default=false`,
  };
}

export async function fetchGoogleBookByIsbn(
  isbn: string,
): Promise<SourceLookupResult> {
  try {
    const data = await requestGoogleBooks(isbn);
    const volumeInfo = data.items?.find((item) => item.volumeInfo)?.volumeInfo;
    return {
      book:
        data.totalItems && data.totalItems > 0 && volumeInfo
          ? buildBookDataFromGoogle(isbn, volumeInfo)
          : null,
    };
  } catch (error) {
    const googleBooksQuotaExceeded =
      error instanceof BookLookupRequestError &&
      error.source === "google_books" &&
      error.status === 429;
    if (!googleBooksQuotaExceeded) {
      console.error("Google Books API error:", error);
    }
    return { book: null, googleBooksQuotaExceeded };
  }
}

export async function fetchOpenLibraryBooksByIsbn(
  isbns: string[],
): Promise<Map<string, BookLookupData>> {
  const normalizedIsbns = Array.from(
    new Set(
      isbns
        .map(normalizeIsbnInput)
        .filter((isbn): isbn is string => Boolean(isbn)),
    ),
  );
  const books = new Map<string, BookLookupData>();
  const uncachedIsbns = normalizedIsbns.filter(
    (isbn) => !openLibraryCache.has(isbn),
  );

  for (const isbn of uncachedIsbns) {
    try {
      const response = await requestOpenLibrarySearch(isbn);
      const book = selectOpenLibrarySearchDoc(isbn, response.docs);
      openLibraryCache.set(
        isbn,
        book ? buildBookDataFromOpenLibrarySearch(isbn, book) : null,
      );
    } catch (error) {
      console.error("Open Library API error:", error);
    }
  }

  for (const isbn of normalizedIsbns) {
    const book = openLibraryCache.get(isbn);
    if (book) books.set(isbn, book);
  }

  return books;
}

export async function fetchOpenLibraryBookByIsbn(
  isbn: string,
): Promise<BookLookupData | null> {
  return (await fetchOpenLibraryBooksByIsbn([isbn])).get(isbn) ?? null;
}

export async function lookupBookByIsbnWithFallback(
  isbn: string,
): Promise<BookLookupResult> {
  const googleResult = await fetchGoogleBookByIsbn(isbn);
  if (googleResult.book) {
    return {
      source: "google_books",
      book: googleResult.book,
      googleBooksQuotaExceeded: googleResult.googleBooksQuotaExceeded,
    };
  }

  const openLibraryBook = await fetchOpenLibraryBookByIsbn(isbn);
  if (openLibraryBook) {
    return {
      source: "open_library",
      book: openLibraryBook,
      googleBooksQuotaExceeded: googleResult.googleBooksQuotaExceeded,
    };
  }

  return {
    source: "manual",
    book: { ISBN: isbn },
    googleBooksQuotaExceeded: googleResult.googleBooksQuotaExceeded,
  };
}
