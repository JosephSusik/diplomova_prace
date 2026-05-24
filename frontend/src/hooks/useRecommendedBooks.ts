// src/hooks/useRecommendedBooks.ts
import { useQuery } from "@tanstack/react-query";
import { Book } from "@/components/general/datagrid/columns/Book";
import { useUser } from "@/context/UserContext";
import { fetchRecommendedBooks } from "@/lib/api";

export function useRecommendedBooks(limit?: number) {
  const { user, token } = useUser();

  return useQuery<Book[], Error>({
    queryKey: ["recommendedBooks", user?.id, limit],
    queryFn: () => {
      if (!token) throw new Error("User not authenticated");
      return fetchRecommendedBooks(token, limit);
    },
    enabled: !!user?.id && !!token,
  });
}
