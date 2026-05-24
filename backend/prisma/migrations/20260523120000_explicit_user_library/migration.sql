-- CreateEnum
CREATE TYPE "public"."LibraryStatus" AS ENUM ('TO_READ', 'READ');

-- CreateTable
CREATE TABLE "public"."UserLibrary" (
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "status" "public"."LibraryStatus" NOT NULL DEFAULT 'TO_READ',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLibrary_pkey" PRIMARY KEY ("userId","bookId")
);

-- Preserve existing implicit many-to-many relations.
INSERT INTO "public"."UserLibrary" ("userId", "bookId", "status", "createdAt")
SELECT ul."B", ul."A", 'TO_READ'::"public"."LibraryStatus", COALESCE(b."created_at", CURRENT_TIMESTAMP)
FROM "public"."_UserLibrary" ul
LEFT JOIN "public"."Book" b ON b."id" = ul."A"
ON CONFLICT ("userId", "bookId") DO NOTHING;

-- Drop old implicit relation table.
DROP TABLE "public"."_UserLibrary";

-- CreateIndex
CREATE INDEX "UserLibrary_bookId_idx" ON "public"."UserLibrary"("bookId");

-- AddForeignKey
ALTER TABLE "public"."UserLibrary" ADD CONSTRAINT "UserLibrary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLibrary" ADD CONSTRAINT "UserLibrary_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
