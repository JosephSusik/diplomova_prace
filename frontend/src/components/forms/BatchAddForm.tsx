"use client"

import { useCallback, useState } from "react"
import { Button } from "../ui/button"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/context/UserContext"
import { scanBarcodeFromImage, batchAddBooks } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"

interface BatchAddFormProps {
    onSuccess?: () => void
}

const ACCEPT = "image/jpeg,image/png,image/gif,image/heic"
const MAX_SIZE_MB = 10
const MAX_FILES = 20

function parseIsbnsFromText(text: string): string[] {
    return text
        .split(/[\s,;\n]+/)
        .map((s) => s.trim().toUpperCase().replace(/[^0-9X]/g, ""))
        .filter((s) => s.length === 10 || s.length === 13)
}

export const BatchAddForm = ({ onSuccess }: BatchAddFormProps) => {
    const { token } = useUser()
    const queryClient = useQueryClient()
    const [files, setFiles] = useState<File[]>([])
    const [isbnInput, setIsbnInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [results, setResults] = useState<
        { isbn: string; success: boolean; error?: string }[] | null
    >(null)

    const handleFilesChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newFiles = Array.from(e.target.files ?? [])
            setError(null)
            const valid: File[] = []
            for (const f of newFiles) {
                if (f.size > MAX_SIZE_MB * 1024 * 1024) continue
                if (valid.length + files.length >= MAX_FILES) break
                valid.push(f)
            }
            setFiles((prev) => [...prev, ...valid].slice(0, MAX_FILES))
        },
        [files.length]
    )

    const removeFile = useCallback((idx: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== idx))
    }, [])

    const handleSubmit = async () => {
        if (!token) {
            setError("Pro batch přidání je nutné přihlášení")
            return
        }

        const isbnsFromText = parseIsbnsFromText(isbnInput)
        const isbns: string[] = [...isbnsFromText]

        if (files.length > 0) {
            for (const file of files) {
                try {
                    const { ISBN } = await scanBarcodeFromImage(file, token)
                    if (ISBN && !isbns.includes(ISBN)) isbns.push(ISBN)
                } catch {
                    // skip failed scans
                }
            }
        }

        if (isbns.length === 0) {
            setError("Přidejte obrázky nebo zadejte ISBN")
            return
        }

        setError(null)
        setResults(null)
        setIsLoading(true)

        try {
            const resp = await batchAddBooks(isbns, token)
            setResults(resp.results)
            const succeeded = resp.results.filter((r) => r.success).length
            if (succeeded > 0) {
                await queryClient.invalidateQueries({ queryKey: ["books"] })
                await queryClient.invalidateQueries({ queryKey: ["myBooks"] })
                onSuccess?.()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Chyba při přidávání")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">ISBN (oddělená čárkou nebo mezerou)</label>
                <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="9780747532699, 9780553103540"
                    value={isbnInput}
                    onChange={(e) => setIsbnInput(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Nebo obrázky s čárovými kódy</label>
                <div
                    className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4",
                        "border-muted-foreground/25 hover:border-muted-foreground/50"
                    )}
                >
                    <input
                        type="file"
                        accept={ACCEPT}
                        multiple
                        onChange={handleFilesChange}
                        className="hidden"
                        id="batch-files"
                    />
                    <label
                        htmlFor="batch-files"
                        className="flex cursor-pointer flex-col items-center gap-1"
                    >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            Přidat obrázky ({files.length}/{MAX_FILES})
                        </span>
                    </label>
                </div>
                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {files.map((f, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-1 rounded border bg-muted/50 px-2 py-1 text-sm"
                            >
                                {f.name}
                                <button
                                    type="button"
                                    onClick={() => removeFile(i)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {results && (
                <div className="rounded border p-3 text-sm">
                    {results.filter((r) => r.success).length} přidáno,{" "}
                    {results.filter((r) => !r.success).length} chyb
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                        {results.map((r, i) => (
                            <li key={i}>
                                {r.isbn}: {r.success ? "✓" : r.error}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="sticky bottom-0 z-10 -mx-6 flex justify-end border-t bg-background px-6 py-4">
                <Button
                    onClick={handleSubmit}
                    disabled={
                        isLoading ||
                        (files.length === 0 && parseIsbnsFromText(isbnInput).length === 0)
                    }
                    className="w-max"
                >
                    {isLoading ? "Přidávám…" : "Přidat knihy"}
                </Button>
            </div>
        </div>
    )
}
