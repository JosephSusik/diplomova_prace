import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { RefinementCtx } from "zod";

const isbn10Pattern = /^\d{9}[0-9X]$/i;
const isbn13Pattern = /^(978|979)\d{10}$/;

function validateNonEmptyIsbn(raw: string, ctx: RefinementCtx) {
  const compact = raw.replace(/[^0-9X]/gi, "").toUpperCase();

  if (compact.length !== 10 && compact.length !== 13) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "ISBN must be 10 characters (9 digits plus check digit or X) or 13 digits. Hyphens and spaces are optional.",
    });
    return;
  }

  if (compact.length === 13 && /^[0-9]{13}$/.test(compact)) {
    if (!compact.startsWith("978") && !compact.startsWith("979")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "13-digit ISBNs must start with 978 or 979.",
      });
      return;
    }
  }

  if (isbn13Pattern.test(compact) || isbn10Pattern.test(compact)) return;

  if (compact.length === 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Invalid ISBN-10: use 9 digits followed by a digit or X as the check character.",
    });
    return;
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Invalid ISBN-13. Check the digits.",
  });
}

/** Empty or valid ISBN (for manual add book form). */
export const isbnSchema = z.string().superRefine((val, ctx) => {
  const v = val.trim();
  if (!v) return;
  validateNonEmptyIsbn(v, ctx);
});

/** Required, valid ISBN (for ISBN lookup). */
export const isbnStrictSchema = z.string().superRefine((val, ctx) => {
  const v = val.trim();
  if (!v) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "ISBN is required",
    });
    return;
  }
  validateNonEmptyIsbn(v, ctx);
});

export const isbnFormSchema = z.object({
  ISBN: isbnStrictSchema,
});

export type ISBNFormValues = z.infer<typeof isbnFormSchema>;

export const useISBNForm = () => {
  const form = useForm<ISBNFormValues>({
    resolver: zodResolver(isbnFormSchema),
    defaultValues: {
      ISBN: "",
    },
  });

  return { form };
};
