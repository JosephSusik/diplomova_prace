import { UserRole, BookGenre } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../src/db";

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

const SEED_START = new Date("2026-01-01");
const SEED_END = new Date("2026-05-10");

function coverUrl(isbn: string) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

async function main() {
  // 1️⃣ Seed users
  const hashedPassword = await bcrypt.hash("Test1234.", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@bookly.com",
      name: "Admin",
      surname: "User",
      password: hashedPassword,
      role: UserRole.Admin,
    },
  });

  const john = await prisma.user.create({
    data: {
      email: "user@bookly.com",
      name: "John",
      surname: "Reader",
      password: hashedPassword,
      role: UserRole.User,
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: "alice@bookly.com",
      name: "Alice",
      surname: "Chen",
      password: hashedPassword,
      role: UserRole.User,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@bookly.com",
      name: "Bob",
      surname: "Kowalski",
      password: hashedPassword,
      role: UserRole.User,
    },
  });

  console.log("✅ Seeded users!");

  // 2️⃣ Seed books
  // HP series — John's main collection
  const hp1 = await prisma.book.create({
    data: {
      ISBN: "9780747532699",
      title: "Harry Potter and the Philosopher's Stone",
      publisher: "Bloomsbury",
      authors: ["J.K. Rowling"],
      genres: [BookGenre.Fantasy],
      cover_url: coverUrl("9780747532699"),
      created_by_id: admin.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: john.id }, { userId: admin.id }] },
    },
  });

  const hp2 = await prisma.book.create({
    data: {
      ISBN: "9780747538493",
      title: "Harry Potter and the Chamber of Secrets",
      publisher: "Bloomsbury",
      authors: ["J.K. Rowling"],
      genres: [BookGenre.Fantasy],
      cover_url: coverUrl("9780747538493"),
      created_by_id: admin.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: john.id }] },
    },
  });

  const hp3 = await prisma.book.create({
    data: {
      ISBN: "9780747542155",
      title: "Harry Potter and the Prisoner of Azkaban",
      publisher: "Bloomsbury",
      authors: ["J.K. Rowling"],
      genres: [BookGenre.Fantasy],
      cover_url: coverUrl("9780747542155"),
      created_by_id: admin.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: john.id }] },
    },
  });

  // GoT series — John's collection
  const got1 = await prisma.book.create({
    data: {
      ISBN: "9780553103540",
      title: "A Game of Thrones",
      publisher: "Bantam Books",
      authors: ["George R.R. Martin"],
      genres: [BookGenre.Fantasy],
      cover_url: coverUrl("9780553103540"),
      created_by_id: admin.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: john.id }] },
    },
  });

  const got2 = await prisma.book.create({
    data: {
      ISBN: "9780553108033",
      title: "A Clash of Kings",
      publisher: "Bantam Books",
      authors: ["George R.R. Martin"],
      genres: [BookGenre.Fantasy],
      cover_url: coverUrl("9780553108033"),
      created_by_id: john.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: john.id }] },
    },
  });

  // The Hobbit — John's collection, Fantasy bridge
  await prisma.book.create({
    data: {
      ISBN: "9780547928227",
      title: "The Hobbit",
      publisher: "Houghton Mifflin Harcourt",
      authors: ["J.R.R. Tolkien"],
      genres: [BookGenre.Fantasy],
      cover_url: coverUrl("9780547928227"),
      created_by_id: admin.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: john.id }] },
    },
  });

  // 1984 — shared by John & Alice (collaborative filtering bridge)
  const book1984 = await prisma.book.create({
    data: {
      ISBN: "9780451524935",
      title: "1984",
      publisher: "Signet Classic",
      authors: ["George Orwell"],
      genres: [BookGenre.SciFi, BookGenre.Fiction],
      cover_url: coverUrl("9780451524935"),
      created_by_id: admin.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: john.id }, { userId: alice.id }] },
    },
  });

  // SciFi — Alice's core collection
  await prisma.book.create({
    data: {
      ISBN: "9780441013593",
      title: "Dune",
      publisher: "Ace Books",
      authors: ["Frank Herbert"],
      genres: [BookGenre.SciFi, BookGenre.Adventure],
      cover_url: coverUrl("9780441013593"),
      created_by_id: admin.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: alice.id }] },
    },
  });

  await prisma.book.create({
    data: {
      ISBN: "9780812550702",
      title: "Ender's Game",
      publisher: "Tor Books",
      authors: ["Orson Scott Card"],
      genres: [BookGenre.SciFi],
      cover_url: coverUrl("9780812550702"),
      created_by_id: alice.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: alice.id }] },
    },
  });

  await prisma.book.create({
    data: {
      ISBN: "9780345391803",
      title: "The Hitchhiker's Guide to the Galaxy",
      publisher: "Del Rey",
      authors: ["Douglas Adams"],
      genres: [BookGenre.SciFi, BookGenre.Fiction],
      cover_url: coverUrl("9780345391803"),
      created_by_id: alice.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: alice.id }] },
    },
  });

  // Da Vinci Code — shared by Alice & Bob (collaborative filtering bridge)
  await prisma.book.create({
    data: {
      ISBN: "9780307474278",
      title: "The Da Vinci Code",
      publisher: "Anchor Books",
      authors: ["Dan Brown"],
      genres: [BookGenre.Thriller, BookGenre.Mystery],
      cover_url: coverUrl("9780307474278"),
      created_by_id: bob.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: alice.id }, { userId: bob.id }] },
    },
  });

  // Mystery & Thriller — Bob's core collection
  await prisma.book.create({
    data: {
      ISBN: "9780307588371",
      title: "Gone Girl",
      publisher: "Crown Publishers",
      authors: ["Gillian Flynn"],
      genres: [BookGenre.Thriller, BookGenre.Mystery],
      cover_url: coverUrl("9780307588371"),
      created_by_id: bob.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: bob.id }] },
    },
  });

  await prisma.book.create({
    data: {
      ISBN: "9780307949486",
      title: "The Girl with the Dragon Tattoo",
      publisher: "Vintage Crime/Black Lizard",
      authors: ["Stieg Larsson"],
      genres: [BookGenre.Mystery, BookGenre.Thriller],
      cover_url: coverUrl("9780307949486"),
      created_by_id: admin.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: bob.id }] },
    },
  });

  // Biography — Bob's collection
  await prisma.book.create({
    data: {
      ISBN: "9780399590504",
      title: "Educated",
      publisher: "Random House",
      authors: ["Tara Westover"],
      genres: [BookGenre.Biography, BookGenre.NonFiction],
      cover_url: coverUrl("9780399590504"),
      created_by_id: bob.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: bob.id }] },
    },
  });

  const steveJobs = await prisma.book.create({
    data: {
      ISBN: "9781451648539",
      title: "Steve Jobs",
      publisher: "Simon & Schuster",
      authors: ["Walter Isaacson"],
      genres: [BookGenre.Biography, BookGenre.NonFiction],
      cover_url: coverUrl("9781451648539"),
      created_by_id: admin.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: bob.id }, { userId: admin.id }] },
    },
  });

  // Classics — not in anyone's library yet (available for recommendations)
  await prisma.book.create({
    data: {
      ISBN: "9780141439518",
      title: "Pride and Prejudice",
      publisher: "Penguin Classics",
      authors: ["Jane Austen"],
      genres: [BookGenre.Classics, BookGenre.Romance],
      cover_url: coverUrl("9780141439518"),
      created_by_id: admin.id,
      created_at: randomDate(SEED_START, SEED_END),
      libraryEntries: { create: [{ userId: admin.id }] },
    },
  });

  await prisma.book.create({
    data: {
      ISBN: "9780061935466",
      title: "To Kill a Mockingbird",
      publisher: "Harper Perennial",
      authors: ["Harper Lee"],
      genres: [BookGenre.Classics, BookGenre.Fiction],
      cover_url: coverUrl("9780061935466"),
      created_by_id: admin.id,
      created_at: randomDate(SEED_START, SEED_END),
    },
  });

  console.log("✅ Seeded books!");
  console.log("");
  console.log("Demo accounts (password: Test1234.):");
  console.log("  admin@bookly.com  — Admin");
  console.log("  user@bookly.com   — John  (Fantasy + Classics)");
  console.log("  alice@bookly.com  — Alice (SciFi + Thriller)");
  console.log("  bob@bookly.com    — Bob   (Mystery + Biography)");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
