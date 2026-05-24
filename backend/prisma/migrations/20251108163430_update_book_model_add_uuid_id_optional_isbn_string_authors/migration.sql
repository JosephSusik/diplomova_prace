/*
  Warnings:

  - The primary key for the `Book` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `Author` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BookAuthors` table. If the table is not empty, all the data it contains will be lost.
  - The required column `id` was added to the `Book` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "public"."_BookAuthors" DROP CONSTRAINT "_BookAuthors_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_BookAuthors" DROP CONSTRAINT "_BookAuthors_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."_UserLibrary" DROP CONSTRAINT "_UserLibrary_A_fkey";

-- AlterTable
ALTER TABLE "public"."Book" DROP CONSTRAINT "Book_pkey",
ADD COLUMN     "authors" TEXT[],
ADD COLUMN     "id" TEXT NOT NULL,
ALTER COLUMN "ISBN" DROP NOT NULL,
ADD CONSTRAINT "Book_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "public"."Author";

-- DropTable
DROP TABLE "public"."_BookAuthors";

-- AddForeignKey
ALTER TABLE "public"."_UserLibrary" ADD CONSTRAINT "_UserLibrary_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
