// src/hooks/useBooks.ts
import { useQuery } from '@tanstack/react-query';
import { Book } from '@/components/general/datagrid/columns/Book';
import { useUser } from '@/context/UserContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;


async function fetchBooks(token: string): Promise<Book[]> {
    const res = await fetch(`${API_URL}/books/all`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch books');
    return res.json();
}

export function useBooks() {
  const { token } = useUser();

  return useQuery<Book[], Error>({
    queryKey: ['books'],
    queryFn: () => {
      if (!token) throw new Error('User not authenticated');
      return fetchBooks(token);
    },
    enabled: !!token,
  });
}
