import { Form, FormControl, FormField, FormMessage } from "../ui/form"
import { ISBNFormValues, useISBNForm } from "./hooks/useISBNForm"
import { FormItem } from "../ui/form"
import { FormLabel } from "../ui/form"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

interface ISBNFormProps {
    onSubmit: (data: ISBNFormValues) => void
    isLoading?: boolean
}

export const ISBNForm = ({ onSubmit, isLoading = false }: ISBNFormProps) => {
    const { form } = useISBNForm()

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <FormField
                    control={form.control}
                    name="ISBN"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ISBN</FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    placeholder="Enter ISBN"
                                    {...field}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="sticky bottom-0 z-10 -mx-6 flex justify-end border-t bg-background px-6 py-4">
                    <Button
                        type="submit"
                        className="w-max"
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isLoading}
                    >
                        {isLoading ? "Searching..." : "Search"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
