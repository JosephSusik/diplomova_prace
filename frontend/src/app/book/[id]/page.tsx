"use client";

import { useParams } from "next/navigation";
import AuthLayout from "@/components/general/AuthLayout";
import { addBookToLibrary, fetchBookById } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Globe, Hash, Users, FileText, Building2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";

export default function BookDetailPage() {
    const params = useParams();
    const bookId = params.id as string;
    const { token } = useUser();
    const queryClient = useQueryClient();

    const { data: book, isLoading, error } = useQuery({
        queryKey: ["book", bookId],
        queryFn: () => {
            if (!token) throw new Error("User not authenticated");
            return fetchBookById(bookId, token);
        },
        enabled: !!bookId && !!token,
    });

    const addMutation = useMutation({
        mutationFn: () => {
            if (!token) throw new Error("User not authenticated");
            return addBookToLibrary(bookId, token);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["book", bookId] });
            await queryClient.invalidateQueries({ queryKey: ["books"] });
            await queryClient.invalidateQueries({ queryKey: ["myBooks"] });
            toast.success("Book added to your library");
        },
        onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Failed to add book");
        },
    });

    if (isLoading) {
        return (
            <AuthLayout>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-48 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Skeleton className="h-64 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AuthLayout>
        );
    }

    if (error || !book) {
        return (
            <AuthLayout>
                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">
                                {error instanceof Error ? error.message : "Book not found"}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </AuthLayout>
        );
    }

    const isInLibrary = !!book.libraryStatus;

    return (
        <AuthLayout>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex gap-6">
                            {book.cover_url && (
                                <img
                                    src={book.cover_url}
                                    alt={book.title}
                                    className="w-48 h-72 object-cover rounded-lg shadow-md"
                                />
                            )}
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <CardTitle className="text-3xl mb-2">{book.title}</CardTitle>
                                        {book.subtitle && (
                                            <p className="text-lg text-muted-foreground">{book.subtitle}</p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        {isInLibrary ? (
                                            <Badge variant="secondary">
                                                {book.libraryStatus === "READ" ? "Read" : "To read"}
                                            </Badge>
                                        ) : (
                                            <Button
                                                onClick={() => addMutation.mutate()}
                                                disabled={addMutation.isPending}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add to library
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {book.genres && book.genres.length > 0 && (
                                        <>
                                            {book.genres.map((genre) => (
                                                <Badge key={genre} variant="secondary">
                                                    {genre}
                                                </Badge>
                                            ))}
                                        </>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    {book.authors && book.authors.length > 0 && (
                                        <div className="flex items-start gap-2">
                                            <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Authors</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {book.authors.join(", ")}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {book.publisher && (
                                        <div className="flex items-start gap-2">
                                            <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Publisher</p>
                                                <p className="text-sm text-muted-foreground">{book.publisher}</p>
                                            </div>
                                        </div>
                                    )}

                                    {book.published_date && (
                                        <div className="flex items-start gap-2">
                                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Published Date</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(book.published_date), "dd.MM.yyyy")}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {book.page_count && (
                                        <div className="flex items-start gap-2">
                                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Page Count</p>
                                                <p className="text-sm text-muted-foreground">{book.page_count}</p>
                                            </div>
                                        </div>
                                    )}

                                    {book.language && (
                                        <div className="flex items-start gap-2">
                                            <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Language</p>
                                                <p className="text-sm text-muted-foreground">{book.language}</p>
                                            </div>
                                        </div>
                                    )}

                                    {book.ISBN && (
                                        <div className="flex items-start gap-2">
                                            <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">ISBN</p>
                                                <p className="text-sm text-muted-foreground">{book.ISBN}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {book.description && (
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Description</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{book.description}</p>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t space-y-4">
                            <div>
                                <p className="text-sm font-medium mb-2">Created by</p>
                                <p className="text-sm text-muted-foreground">
                                    {book.created_by.name} {book.created_by.surname}
                                </p>
                            </div>

                            {book.addedByUsers && book.addedByUsers.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Added by users</p>
                                    <div className="flex flex-wrap gap-2">
                                        {book.addedByUsers.map((user) => (
                                            <Badge key={user.id} variant="outline">
                                                {user.name} {user.surname}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthLayout>
    );
}
