/**
 * Seed books from demo_books folder.
 * Scans barcodes from images, fetches book data, and adds to DB.
 *
 * Usage: pnpm db:seed:books
 * Requires: db:seed to have run first (for users)
 */
import * as fs from "fs";
import * as path from "path";
import { prisma } from "../src/db";
import { scanBarcodeFromImage, isSupportedImageFile } from "../src/services/barcode";
import { lookupBookByIsbnWithFallback } from "../src/services/bookLookup";

const DEMO_BOOKS_DIR = path.join(__dirname, "../../demo_books");

async function main() {
  if (!fs.existsSync(DEMO_BOOKS_DIR)) {
    console.error(`❌ demo_books folder not found at ${DEMO_BOOKS_DIR}`);
    process.exit(1);
  }

  const admin = await prisma.user.findFirst({
    where: { role: "Admin" },
  });
  if (!admin) {
    console.error("❌ No admin user found. Run pnpm db:seed first.");
    process.exit(1);
  }

  const files = fs
    .readdirSync(DEMO_BOOKS_DIR)
    .filter((f) => isSupportedImageFile(f))
    .sort();

  console.log(`📚 Found ${files.length} images in demo_books`);
  console.log("Each new decoded ISBN may call Google Books and Open Library fallback.");

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = path.join(DEMO_BOOKS_DIR, file);
    process.stdout.write(`  ${file} ... `);

    try {
      const isbn = await scanBarcodeFromImage(filePath);
      if (!isbn) {
        console.log("no barcode");
        failed++;
        continue;
      }

      const existing = await prisma.book.findUnique({
        where: { ISBN: isbn },
      });
      if (existing) {
        console.log(`skipped (already exists: ${existing.title})`);
        skipped++;
        continue;
      }

      const lookup = await lookupBookByIsbnWithFallback(isbn);
      if (lookup.source === "manual") {
        console.log(`not found in external metadata sources (ISBN: ${isbn})`);
        failed++;
        continue;
      }

      await prisma.book.create({
        data: {
          ...lookup.book,
          created_by_id: admin.id,
          libraryEntries: { create: { userId: admin.id } },
        },
      });

      console.log(`✓ ${lookup.book.title} (${lookup.source})`);
      added++;
    } catch (err) {
      console.log(`error: ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log(`\n✅ Done! Added: ${added}, Skipped: ${skipped}, Failed: ${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
