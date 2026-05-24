"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Library, Sparkles, User } from "lucide-react";
import AuthLayout from "@/components/general/AuthLayout";
import { useMyBooks } from "@/hooks/useMyBooks";
import { useRecommendedBooks } from "@/hooks/useRecommendedBooks";
import { useUser } from "@/context/UserContext";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
    const { data: books, isLoading } = useMyBooks();
    const { data: recommendedBooks, isLoading: recommendedLoading } = useRecommendedBooks(6);
    const { user } = useUser();
    const router = useRouter();

    const stats = useMemo(() => {
        if (!books) return null;

        const totalBooks = books.length;
        const totalPages = books.reduce((sum, book) => sum + (book.page_count || 0), 0);
        const avgPages = totalBooks > 0 ? Math.round(totalPages / totalBooks) : 0;

        // Genre distribution
        const genreCount: Record<string, number> = {};
        books.forEach(book => {
            book.genres?.forEach(genre => {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
        });
        const topGenres = Object.entries(genreCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([genre]) => genre);

        // Author distribution
        const authorCount: Record<string, number> = {};
        books.forEach(book => {
            book.authors?.forEach(author => {
                authorCount[author] = (authorCount[author] || 0) + 1;
            });
        });
        const topAuthors = Object.entries(authorCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([author]) => author);

        // Recent books (last 6)
        const recentBooks = [...books]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 6);

        // Books added this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const booksThisMonth = books.filter(book =>
            new Date(book.created_at) >= startOfMonth
        ).length;

        return {
            totalBooks,
            totalPages,
            avgPages,
            topGenres,
            topAuthors,
            recentBooks,
            booksThisMonth,
        };
    }, [books]);

    if (isLoading) {
        return (
            <AuthLayout>
                <div className="mb-8">
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            {/* Welcome Section */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Welcome back{user?.name ? `, ${user.name}` : ""}!
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Here&apos;s what&apos;s happening with your book collection.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalBooks || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.booksThisMonth || 0} added this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.totalPages ? stats.totalPages.toLocaleString() : 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.avgPages || 0} pages per book avg
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Genres</CardTitle>
                        <Library className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.topGenres.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.topGenres.length ? `Top: ${stats.topGenres.join(", ")}` : "No genres yet"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Authors</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.topAuthors.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.topAuthors.length ? `${stats.topAuthors.length} unique authors` : "No authors yet"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recommended for You */}
            {(recommendedLoading || (recommendedBooks && recommendedBooks.length > 0)) && (
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Recommended for You
                            </CardTitle>
                            <button
                                onClick={() => router.push("/explore")}
                                className="text-sm text-primary hover:underline"
                            >
                                Browse all
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Based on your library genres and authors
                        </p>
                    </CardHeader>
                    <CardContent>
                        {recommendedLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {(recommendedBooks ?? []).map((book) => (
                                    <div
                                        key={book.id}
                                        onClick={() => router.push(`/book/${book.id}?from=dashboard`)}
                                        className="cursor-pointer group"
                                    >
                                        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2 group-hover:opacity-90 transition-opacity">
                                            {book.cover_url ? (
                                                <img
                                                    src={book.cover_url}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium truncate">{book.title}</p>
                                        {book.authors && book.authors.length > 0 && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {book.authors[0]}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Recent Books */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Recent Books</CardTitle>
                            <button
                                onClick={() => router.push("/my-books")}
                                className="text-sm text-primary hover:underline"
                            >
                                View all
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {stats?.recentBooks && stats.recentBooks.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {stats.recentBooks.map((book) => (
                                    <div
                                        key={book.id}
                                        onClick={() => router.push(`/book/${book.id}?from=dashboard`)}
                                        className="cursor-pointer group"
                                    >
                                        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2 group-hover:opacity-90 transition-opacity">
                                            {book.cover_url ? (
                                                <img
                                                    src={book.cover_url}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium truncate">{book.title}</p>
                                        {book.authors && book.authors.length > 0 && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {book.authors[0]}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No books yet. Add your first book!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Authors & Genres */}
                <div className="space-y-6">
                    {/* Top Authors */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Authors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stats?.topAuthors && stats.topAuthors.length > 0 ? (
                                <div className="space-y-2">
                                    {stats.topAuthors.map((author, index) => (
                                        <div key={author} className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-muted-foreground w-6">
                                                {index + 1}.
                                            </span>
                                            <span className="text-sm">{author}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No authors yet</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Genres */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Genres</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stats?.topGenres && stats.topGenres.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {stats.topGenres.map((genre) => (
                                        <Badge key={genre} variant="secondary">
                                            {genre}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No genres yet</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthLayout>
    );
}
