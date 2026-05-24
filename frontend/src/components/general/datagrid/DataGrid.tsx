import { ColumnDef } from "@tanstack/react-table"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, Search } from "lucide-react"
import { useState } from "react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"

interface DataGridProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    isLoading?: boolean
}

export function DataGrid<TData, TValue>({
    columns,
    data,
    isLoading = false,
    onRowClick,
}: DataGridProps<TData, TValue> & { onRowClick?: (row: TData) => void }) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = useState("")

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

    const handleRowClick = (row: TData) => {
        if (onRowClick) {
            onRowClick(row)
        }
    }

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={globalFilter}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    placeholder="Filter books..."
                    className="pl-8"
                />
            </div>
            <div className="min-w-0 flex-1 overflow-y-auto rounded-md border">
                <Table className="h-full relative">
                    <TableHeader className="sticky top-0 bg-white z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const canSort = header.column.getCanSort()
                                    const sortState = header.column.getIsSorted()
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <button
                                                    type="button"
                                                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                                    className={canSort ? "inline-flex items-center gap-1 font-medium" : "font-medium"}
                                                    disabled={!canSort}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {sortState === "asc" && <ArrowUp className="h-3 w-3" />}
                                                    {sortState === "desc" && <ArrowDown className="h-3 w-3" />}
                                                </button>
                                            )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    onClick={() => handleRowClick(row.original)}
                                    className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
export default DataGrid;
