-- CreateEnum
CREATE TYPE "public"."BookGenre" AS ENUM ('Fiction', 'NonFiction', 'Fantasy', 'SciFi', 'Mystery', 'Romance', 'Thriller', 'Biography', 'History', 'SelfHelp', 'Children', 'Adventure', 'Horror', 'Classics', 'Poetry', 'GraphicNovel');

-- CreateTable
CREATE TABLE "public"."Book" (
    "ISBN" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "publisher" TEXT,
    "published_date" TIMESTAMP(3),
    "page_count" INTEGER,
    "language" TEXT,
    "genres" "public"."BookGenre"[],
    "description" TEXT,
    "cover_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("ISBN")
);

-- CreateTable
CREATE TABLE "public"."Author" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_UserLibrary" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserLibrary_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_BookAuthors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BookAuthors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_ISBN_key" ON "public"."Book"("ISBN");

-- CreateIndex
CREATE UNIQUE INDEX "Author_name_key" ON "public"."Author"("name");

-- CreateIndex
CREATE INDEX "_UserLibrary_B_index" ON "public"."_UserLibrary"("B");

-- CreateIndex
CREATE INDEX "_BookAuthors_B_index" ON "public"."_BookAuthors"("B");

-- AddForeignKey
ALTER TABLE "public"."Book" ADD CONSTRAINT "Book_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserLibrary" ADD CONSTRAINT "_UserLibrary_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Book"("ISBN") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserLibrary" ADD CONSTRAINT "_UserLibrary_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BookAuthors" ADD CONSTRAINT "_BookAuthors_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BookAuthors" ADD CONSTRAINT "_BookAuthors_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Book"("ISBN") ON DELETE CASCADE ON UPDATE CASCADE;
