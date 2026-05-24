import { Book } from "@/components/general/datagrid/columns/Book";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const BOOK_GENRES = [
  "Fiction",
  "NonFiction",
  "Fantasy",
  "SciFi",
  "Mystery",
  "Romance",
  "Thriller",
  "Biography",
  "History",
  "SelfHelp",
  "Children",
  "Adventure",
  "Horror",
  "Classics",
  "Poetry",
  "GraphicNovel",
] as const;

export type BookGenre = (typeof BOOK_GENRES)[number];
export type LibraryStatus = "TO_READ" | "READ";

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error("Invalid credentials");
  }

  return res.json(); // { token, user, message }
}

export async function fetchUsers(token?: string) {
  const res = await fetch(`${API_URL}/users`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

/** Shown when no external source can prefill metadata after Google Books returns 429. */
export const GOOGLE_BOOKS_QUOTA_EXCEEDED_MESSAGE =
  "Google Books reached its search limit and no fallback metadata was found. You can still add the book below.";

export const OPEN_LIBRARY_FALLBACK_MESSAGE =
  "Google Books did not return metadata, so Bookly used Open Library. Please review the fields before saving.";

export const MANUAL_BOOK_LOOKUP_MESSAGE =
  "No external metadata was found. Please fill in the book details manually.";

export interface SearchByISBNResponse {
  source: "database" | "google_books" | "open_library" | "manual";
  /** Present when Google Books blocked the lookup due to quota (HTTP 429). */
  googleBooksQuotaExceeded?: boolean;
  book: {
    ISBN?: string;
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    published_date?: string | Date;
    page_count?: number;
    language?: string;
    genres?: BookGenre[];
    description?: string;
    cover_url?: string;
  };
  disabledFields: string[];
}

export async function scanBarcodeFromImage(
  imageFile: File,
  token: string
): Promise<{ ISBN: string }> {
  const formData = new FormData();
  formData.append("image", imageFile);

  const res = await fetch(`${API_URL}/books/scan-barcode`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to scan barcode");
  }
  return res.json();
}

export async function batchAddBooks(
  isbns: string[],
  token: string
): Promise<{
  message: string;
  results: { isbn: string; success: boolean; error?: string }[];
}> {
  const res = await fetch(`${API_URL}/books/batch-add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isbns }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to add books");
  }
  return res.json();
}

export async function searchBookByISBN(ISBN: string, token: string): Promise<SearchByISBNResponse> {
  const res = await fetch(`${API_URL}/books/search-by-isbn`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ISBN }),
  });

  if (!res.ok) {
    let errorMessage = "Failed to search for book";
    try {
      const error = await res.json();
      errorMessage = error.error || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export interface CreateBookData {
  ISBN?: string;
  title: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  published_date?: Date | string;
  page_count?: number;
  language?: string;
  genres?: BookGenre[];
  description?: string;
  cover_url?: string;
}

export async function createBook(data: CreateBookData, token: string) {
  const res = await fetch(`${API_URL}/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let errorMessage = "Failed to create book";
    try {
      const error = await res.json();
      errorMessage = error.error || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function fetchRecommendedBooks(token: string, limit?: number): Promise<Book[]> {
  const url = new URL(`${API_URL}/books/recommended`);
  if (limit) url.searchParams.set("limit", String(limit));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let errorMessage = "Failed to fetch recommendations";
    try {
      const error = await res.json();
      errorMessage = error.error || errorMessage;
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function fetchBookById(id: string, token: string): Promise<Book> {
  const res = await fetch(`${API_URL}/books/by-id/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    let errorMessage = "Failed to fetch book";
    try {
      const error = await res.json();
      errorMessage = error.error || errorMessage;
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function addBookToLibrary(
  bookId: string,
  token: string,
  status: LibraryStatus = "TO_READ"
): Promise<{ message: string; book: Book }> {
  const res = await fetch(`${API_URL}/books/${bookId}/library`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to add book to library");
  }
  return res.json();
}

export async function updateLibraryStatus(
  bookId: string,
  status: LibraryStatus,
  token: string
): Promise<{ message: string; book: Book }> {
  const res = await fetch(`${API_URL}/books/${bookId}/library`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update library status");
  }
  return res.json();
}

export async function removeBookFromLibrary(
  bookId: string,
  token: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/books/${bookId}/library`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to remove book from library");
  }
  return res.json();
}
