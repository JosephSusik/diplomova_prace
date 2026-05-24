"use client"

import { useCallback, useState } from "react"
import { Button } from "../ui/button"
import { ScanLine, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BarcodeScanFormProps {
    onISBNFound: (isbn: string) => void
    onScan: (file: File) => Promise<string>
    isLoading?: boolean
}

const ACCEPT = "image/jpeg,image/png,image/gif,image/heic"
const MAX_SIZE_MB = 10

export const BarcodeScanForm = ({
    onISBNFound,
    onScan,
    isLoading = false,
}: BarcodeScanFormProps) => {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0]
            setError(null)
            if (preview) URL.revokeObjectURL(preview)
            setPreview(null)
            if (!f) {
                setFile(null)
                return
            }
            if (f.size > MAX_SIZE_MB * 1024 * 1024) {
                setError(`Max size ${MAX_SIZE_MB} MB`)
                setFile(null)
                return
            }
            setFile(f)
            const url = URL.createObjectURL(f)
            setPreview(url)
        },
        [preview]
    )

    const handleRemove = useCallback(() => {
        if (preview) URL.revokeObjectURL(preview)
        setFile(null)
        setPreview(null)
        setError(null)
    }, [preview])

    const handleSubmit = async () => {
        if (!file) {
            setError("Vyberte obrázek")
            return
        }
        setError(null)
        try {
            const isbn = await onScan(file)
            onISBNFound(isbn)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Nepodařilo se načíst čárový kód")
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div
                className={cn(
                    "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
                    file
                        ? "border-primary/50 bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
            >
                <input
                    type="file"
                    accept={ACCEPT}
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    disabled={isLoading}
                />
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt="Náhled"
                            className="max-h-32 rounded object-contain"
                        />
                        <p className="text-sm text-muted-foreground">{file?.name}</p>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleRemove()
                            }}
                        >
                            <X className="h-4 w-4" />
                            Smazat
                        </Button>
                    </>
                ) : (
                    <>
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            Klikněte nebo přetáhněte obrázek s čárovým kódem
                        </p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, GIF, HEIC • max {MAX_SIZE_MB} MB</p>
                    </>
                )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="sticky bottom-0 z-10 -mx-6 flex justify-end border-t bg-background px-6 py-4">
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!file || isLoading}
                    className="w-max"
                >
                    <ScanLine className="mr-2 h-4 w-4" />
                    {isLoading ? "Kontroluji…" : "Načíst ISBN"}
                </Button>
            </div>
        </div>
    )
}
