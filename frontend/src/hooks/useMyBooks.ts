// src/hooks/useMyBooks.ts
import { useQuery } from '@tanstack/react-query';
import { Book } from '@/components/general/datagrid/columns/Book';
import { useUser } from '@/context/UserContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchMyBooks(userId: string, token: string): Promise<Book[]> {
    const res = await fetch(`${API_URL}/books/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });    
    if (!res.ok) throw new Error('Failed to fetch my books');
    return res.json();
}

export function useMyBooks() {
    const { user, token } = useUser();
    
    return useQuery<Book[], Error>({
        queryKey: ['myBooks', user?.id],
        queryFn: () => {
            if (!user?.id || !token) {
                throw new Error('User not authenticated');
            }
            return fetchMyBooks(user.id, token);
        },
        enabled: !!user?.id && !!token,
    });
}

