import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { isbnSchema } from "./useISBNForm"
import { BOOK_GENRES } from "@/lib/api"

const addBookFormSchema = z.object({
    ISBN: isbnSchema.optional(),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    authors: z.array(z.string()).optional(),
    publisher: z.string().optional(),
    published_date: z.date().optional(),
    page_count: z.number().optional(),
    language: z.string().optional(),
    genres: z.array(z.enum(BOOK_GENRES)).optional(),
    description: z.string().optional(),
    cover_url: z.string().optional(),
})

export type AddBookFormValues = z.infer<typeof addBookFormSchema>

export const useAddBookForm = () => {
    const form = useForm<AddBookFormValues>({
        resolver: zodResolver(addBookFormSchema),
        defaultValues: {
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
        },
    })

    return { form }
}
