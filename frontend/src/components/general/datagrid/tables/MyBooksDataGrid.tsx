import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Check, Clock, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { AddBookModal } from "../../AddBookModal";
import { DataGrid } from "../DataGrid"
import { Book, bookColumns } from "../columns/Book"
import { useMyBooks } from "@/hooks/useMyBooks"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { removeBookFromLibrary, updateLibraryStatus } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { useQueryClient } from "@tanstack/react-query";

export const MyBooksDataGrid = () => {
    const { data: books, isLoading } = useMyBooks();
    const router = useRouter();
    const { token } = useUser();
    const queryClient = useQueryClient();

    const refreshLibrary = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ["myBooks"] });
        await queryClient.invalidateQueries({ queryKey: ["books"] });
        await queryClient.invalidateQueries({ queryKey: ["recommendedBooks"] });
    }, [queryClient]);

    const columns = useMemo<ColumnDef<Book>[]>(() => [
        ...bookColumns,
        {
            id: "actions",
            header: "Actions",
            enableSorting: false,
            cell: ({ row }) => {
                const book = row.original;
                const isRead = book.libraryStatus === "READ";
                const nextStatus = isRead ? "TO_READ" : "READ";
                const actionLabel = isRead ? "Move to To Read" : "Mark as Read";
                const confirmationTitle = isRead ? "Move book to To Read?" : "Mark book as Read?";
                const confirmationDescription = isRead
                    ? `This will move "${book.title}" back to your To Read list.`
                    : `This will mark "${book.title}" as finished.`;

                return (
                    <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                >
                                    {isRead ? <Clock className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                    {actionLabel}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{confirmationTitle}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {confirmationDescription}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={async () => {
                                            if (!token) return;
                                            try {
                                                await updateLibraryStatus(book.id, nextStatus, token);
                                                await refreshLibrary();
                                                toast.success(isRead ? "Moved to To Read" : "Marked as Read");
                                            } catch (err) {
                                                toast.error(err instanceof Error ? err.message : "Failed to update status");
                                            }
                                        }}
                                    >
                                        Confirm
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                );
            },
        },
        {
            id: "remove",
            header: "",
            enableSorting: false,
            cell: ({ row }) => {
                const book = row.original;

                return (
                    <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    aria-label="Remove from library"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Remove book from your library?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will remove &quot;{book.title}&quot; from My Books. The book will remain available in the catalogue.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive text-white hover:bg-destructive/90"
                                        onClick={async () => {
                                            if (!token) return;
                                            try {
                                                await removeBookFromLibrary(book.id, token);
                                                await refreshLibrary();
                                                toast.success("Book removed from your library");
                                            } catch (err) {
                                                toast.error(err instanceof Error ? err.message : "Failed to remove book");
                                            }
                                        }}
                                    >
                                        Remove
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                );
            },
        },
    ], [token, refreshLibrary]);

    return (
        <div className="flex h-min max-h-full min-w-0 flex-col gap-2">
            <div className="flex min-w-0 items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-gray-900">My Books</h2>
                <AddBookModal />
            </div>
            <DataGrid columns={columns} data={books ?? []} isLoading={isLoading} onRowClick={(row) => router.push(`/book/${row.id}?from=my-books`)} />
        </div>
    )
}
