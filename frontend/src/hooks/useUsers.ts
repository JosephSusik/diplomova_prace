// src/hooks/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { User } from '@/components/general/datagrid/columns/User';
import { useUser } from '@/context/UserContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchUsers(token: string): Promise<User[]> {
    const res = await fetch(`${API_URL}/users`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
}

export function useUsers() {
    const { token } = useUser();
    return useQuery<User[], Error>({
        queryKey: ['users'],
        queryFn: () => fetchUsers(token!),
        enabled: !!token,
    });
}

