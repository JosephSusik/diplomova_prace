import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Textarea } from "../ui/textarea"
import { AddBookFormValues, useAddBookForm } from "./hooks/useAddBookForm"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { useState, useEffect } from "react"
import { BOOK_GENRES, BookGenre, SearchByISBNResponse } from "@/lib/api"
import { Checkbox } from "../ui/checkbox"


interface AddBookFormProps {
    onSubmit: (data: AddBookFormValues) => void
    prefilledData?: SearchByISBNResponse | null
}

export const AddBookForm = ({ onSubmit, prefilledData }: AddBookFormProps) => {
    const { form } = useAddBookForm()
    const [calendarOpen, setCalendarOpen] = useState(false)

    // Populate form when prefilledData changes
    useEffect(() => {
        if (prefilledData?.book) {
            const book = prefilledData.book
            form.reset({
                ISBN: book.ISBN ?? "",
                title: book.title ?? "",
                subtitle: book.subtitle ?? "",
                authors: book.authors ?? [],
                publisher: book.publisher ?? "",
                published_date: book.published_date
                    ? (typeof book.published_date === "string"
                        ? new Date(book.published_date)
                        : book.published_date)
                    : undefined,
                page_count: book.page_count ?? undefined,
                language: book.language ?? "",
                genres: book.genres ?? [],
                description: book.description ?? "",
                cover_url: book.cover_url ?? "",
            })
        } else if (prefilledData === null) {
            // Reset to default values when prefilledData is explicitly null
            form.reset({
                ISBN: "",
                title: "",
                subtitle: "",
                authors: [],
                publisher: "",
                published_date: undefined,
                page_count: undefined,
                language: "",
                genres: [],
                description: "",
                cover_url: "",
            })
        }
    }, [prefilledData, form])

    const isFieldDisabled = (fieldName: string) => {
        return prefilledData?.disabledFields?.includes(fieldName) || false
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <FormField
                    control={form.control}
                    name="ISBN"
                    render={({ field }) => {
                        const disabled = isFieldDisabled("ISBN")
                        return (
                            <FormItem>
                                <FormLabel>ISBN</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder="Book ISBN"
                                        {...field}
                                        value={field.value ?? ""}
                                        disabled={disabled}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )
                    }}
                />
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => {
                        const disabled = isFieldDisabled("title")
                        return (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder="Book title"
                                        {...field}
                                        value={field.value ?? ""}
                                        disabled={disabled}
                                    />
                                </FormControl>
                            </FormItem>
                        )
                    }}
                />
                <FormField
                    control={form.control}
                    name="subtitle"
                    render={({ field }) => {
                        const disabled = isFieldDisabled("subtitle")
                        return (
                            <FormItem>
                                <FormLabel>Subtitle</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder="Book subtitle"
                                        {...field}
                                        value={field.value ?? ""}
                                        disabled={disabled}
                                    />
                                </FormControl>
                            </FormItem>
                        )
                    }}
                />
                <FormField
                    control={form.control}
                    name="authors"
                    render={({ field }) => {
                        const disabled = isFieldDisabled("authors")
                        return (
                            <FormItem>
                                <FormLabel>Authors</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder="Book authors (comma-separated)"
                                        value={Array.isArray(field.value) ? field.value.join(", ") : field.value || ""}
                                        onChange={(e) => {
                                            const authorsArray = e.target.value
                                                .split(",")
                                                .map(a => a.trim())
                                                .filter(a => a.length > 0)
                                            field.onChange(authorsArray)
                                        }}
                                        disabled={disabled}
                                    />
                                </FormControl>
                            </FormItem>
                        )
                    }}
                />
                <FormField
                    control={form.control}
                    name="publisher"
                    render={({ field }) => {
                        const disabled = isFieldDisabled("publisher")
                        return (
                            <FormItem>
                                <FormLabel>Publisher</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder="Book publisher"
                                        {...field}
                                        value={field.value ?? ""}
                                        disabled={disabled}
                                    />
                                </FormControl>
                            </FormItem>
                        )
                    }}
                />
                <FormField
                    control={form.control}
                    name="published_date"
                    render={({ field }) => {
                        const isDisabled = isFieldDisabled("published_date")
                        return (
                            <FormItem className="flex flex-col">
                                <FormLabel>Published Date</FormLabel>
                                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                                disabled={isDisabled}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    {!isDisabled && (
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                            sideOffset={4}
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={(date) => {
                                                    field.onChange(date)
                                                    setCalendarOpen(false)
                                                }}
                                            />
                                        </PopoverContent>
                                    )}
                                </Popover>
                            </FormItem>
                        )
                    }}
                />
                <FormField
                    control={form.control}
                    name="page_count"
                    render={({ field }) => {
                        const disabled = isFieldDisabled("page_count")
                        return (
                            <FormItem>
                                <FormLabel>Page Count</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Book page count"
                                        value={field.value ?? ""}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            field.onChange(value ? parseInt(value, 10) : undefined)
                                        }}
                                        disabled={disabled}
                                    />
                                </FormControl>
                            </FormItem>
                        )
                    }}
                />
                <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => {
                        const disabled = isFieldDisabled("language")
                        return (
                            <FormItem>
                                <FormLabel>Language</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder="Book language"
                                        {...field}
                                        value={field.value ?? ""}
                                        disabled={disabled}
                                    />
                                </FormControl>
                            </FormItem>
                        )
                    }}
                />
                <FormField
                    control={form.control}
                    name="genres"
                    render={({ field }) => {
                        const disabled = isFieldDisabled("genres")
                        const selected = field.value ?? []
                        return (
                            <FormItem>
                                <FormLabel>Genres</FormLabel>
                                <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                                    {BOOK_GENRES.map((genre) => (
                                        <label
                                            key={genre}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={selected.includes(genre)}
                                                disabled={disabled}
                                                onCheckedChange={(checked) => {
                                                    if (disabled) return
                                                    const next = checked
                                                        ? [...selected, genre]
                                                        : selected.filter((value: BookGenre) => value !== genre)
                                                    field.onChange(next)
                                                }}
                                            />
                                            {genre}
                                        </label>
                                    ))}
                                </div>
                            </FormItem>
                        )
                    }}
                />
                <FormField
                    control={form.control}
                    name="cover_url"
                    render={({ field }) => {
                        const disabled = isFieldDisabled("cover_url")
                        return (
                            <FormItem>
                                <FormLabel>Cover URL</FormLabel>
                                <FormControl>
                                    <Input
                                        type="url"
                                        placeholder="https://..."
                                        {...field}
                                        value={field.value ?? ""}
                                        disabled={disabled}
                                    />
                                </FormControl>
                            </FormItem>
                        )
                    }}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => {
                        const disabled = isFieldDisabled("description")
                        return (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Book description"
                                        {...field}
                                        value={field.value ?? ""}
                                        disabled={disabled}
                                    />
                                </FormControl>
                            </FormItem>
                        )
                    }}
                />
                <div className="sticky bottom-0 z-10 -mx-6 flex justify-end border-t bg-background px-6 py-4">
                    <Button type="submit" className="w-max" onClick={form.handleSubmit(onSubmit)}>Add Book</Button>
                </div>
            </form>
        </Form >
    )
}
