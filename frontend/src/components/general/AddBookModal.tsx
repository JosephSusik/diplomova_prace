import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "../ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { AddBookForm } from "../forms/AddBookForm"
import { AddBookFormValues } from "../forms/hooks/useAddBookForm"
import { ISBNForm } from "../forms/ISBNForm"
import { ISBNFormValues } from "../forms/hooks/useISBNForm"
import { BarcodeScanForm } from "../forms/BarcodeScanForm"
import { BatchAddForm } from "../forms/BatchAddForm"
import { useUser } from "@/context/UserContext"
import {
    searchBookByISBN,
    createBook,
    scanBarcodeFromImage,
    GOOGLE_BOOKS_QUOTA_EXCEEDED_MESSAGE,
    MANUAL_BOOK_LOOKUP_MESSAGE,
    OPEN_LIBRARY_FALLBACK_MESSAGE,
    type SearchByISBNResponse,
} from "@/lib/api"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

type AddMode = "manual" | "isbn" | "barcode" | "batch"

export const AddBookModal = () => {
    const [openDialog, setOpenDialog] = useState(false)
    const [mode, setMode] = useState<AddMode | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [prefilledData, setPrefilledData] = useState<SearchByISBNResponse | null>(null)
    const { token } = useUser()
    const queryClient = useQueryClient()

    const handleOpenDialog = (selectedMode: AddMode) => {
        setMode(selectedMode)
        setOpenDialog(true)
        setPrefilledData(null)
    }

    const handleCloseDialog = () => {
        setOpenDialog(false)
        setMode(null)
        setPrefilledData(null)
        setIsSearching(false)
    }

    const notifyLookupResult = (result: SearchByISBNResponse) => {
        if (result.source === "open_library") {
            toast.info(OPEN_LIBRARY_FALLBACK_MESSAGE)
            return
        }
        if (result.googleBooksQuotaExceeded) {
            toast.warning(GOOGLE_BOOKS_QUOTA_EXCEEDED_MESSAGE)
            return
        }
        if (result.source === "manual") {
            toast.info(MANUAL_BOOK_LOOKUP_MESSAGE)
        }
    }

    const handleFindBook = async (data: ISBNFormValues) => {
        if (!token) {
            toast.error("Please log in to search for books")
            return
        }
        setIsSearching(true)
        try {
            const result = await searchBookByISBN(data.ISBN, token)
            notifyLookupResult(result)
            setPrefilledData(result)
            setMode("manual")
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to search for book"
            toast.warning(errorMessage)
        } finally {
            setIsSearching(false)
        }
    }

    const handleBarcodeScan = async (file: File) => {
        if (!token) throw new Error("Please log in")
        const { ISBN } = await scanBarcodeFromImage(file, token)
        return ISBN
    }

    const handleISBNFoundFromBarcode = async (isbn: string) => {
        if (!token) return
        setIsSearching(true)
        try {
            const result = await searchBookByISBN(isbn, token)
            notifyLookupResult(result)
            setPrefilledData(result)
            setMode("manual")
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to search for book"
            toast.warning(errorMessage)
        } finally {
            setIsSearching(false)
        }
    }

    const handleSaveBook = async (data: AddBookFormValues) => {
        if (!token) {
            toast.error("Please log in to add books")
            return
        }
        try {
            await createBook(data, token)
            await queryClient.invalidateQueries({ queryKey: ["books"] })
            await queryClient.invalidateQueries({ queryKey: ["myBooks"] })
            toast.success("Book added successfully!")
            handleCloseDialog()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to add book")
        }
    }

    const titles: Record<AddMode, string> = {
        manual: "Add Book",
        isbn: "Add Book (ISBN)",
        barcode: "Add Book (Scan barcode)",
        batch: "Batch Add Books",
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button>
                        <Plus className="h-4 w-4" />
                        Add Book
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenDialog("isbn")} className="cursor-pointer">
                        ISBN
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenDialog("barcode")} className="cursor-pointer">
                        Scan barcode
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenDialog("manual")} className="cursor-pointer">
                        Manual
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenDialog("batch")} className="cursor-pointer">
                        Batch add
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={openDialog} onOpenChange={handleCloseDialog}>
                <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-y-none p-0" showCloseButton={false}>
                    <DialogHeader className="sticky top-0 z-20 border-b bg-background px-6 py-4 pr-12">
                        <DialogTitle>{mode ? titles[mode] : "Add Book"}</DialogTitle>
                        <DialogClose className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </DialogClose>
                        {mode === "manual" && prefilledData?.source === "database" && (
                            <DialogDescription>
                                Some fields are disabled because this book already exists in our database.
                            </DialogDescription>
                        )}
                        {mode === "manual" && prefilledData?.source === "open_library" && (
                            <DialogDescription>
                                Metadata was filled from Open Library fallback and can be edited before saving.
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    <div className="px-6 pb-0 pt-4">
                        {mode === "manual" && (
                            <AddBookForm
                                onSubmit={handleSaveBook}
                                prefilledData={prefilledData}
                            />
                        )}

                        {mode === "isbn" && (
                            <ISBNForm
                                onSubmit={handleFindBook}
                                isLoading={isSearching}
                            />
                        )}

                        {mode === "barcode" && (
                            <BarcodeScanForm
                                onScan={handleBarcodeScan}
                                onISBNFound={handleISBNFoundFromBarcode}
                                isLoading={isSearching}
                            />
                        )}

                        {mode === "batch" && (
                            <BatchAddForm
                                onSuccess={() => toast.success("Books added!")}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
