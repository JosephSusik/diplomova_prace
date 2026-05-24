import { AddBookModal } from "../../AddBookModal";
import { DataGrid } from "../DataGrid"
import { bookColumns } from "../columns/Book"
import { useBooks } from "@/hooks/useBooks"
import { usePathname, useRouter } from "next/navigation";

export const AllBooksDataGrid = () => {
    const { data: books, isLoading } = useBooks();
    const router = useRouter();
    const pathname = usePathname();
    const from = pathname?.startsWith("/admin") ? "all-books" : "explore";
    const title = pathname?.startsWith("/admin") ? "All Books" : "Explore";

    return (
        <div className="flex h-min max-h-full min-w-0 flex-col gap-2">
            <div className="flex min-w-0 items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <AddBookModal />
            </div>
            <DataGrid columns={bookColumns} data={books ?? []} isLoading={isLoading} onRowClick={(row) => router.push(`/book/${row.id}?from=${from}`)} />
        </div>
    )
}
