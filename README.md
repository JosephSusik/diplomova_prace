# Bookly

Bookly is a full-stack application for managing and discovering books.

## Requirements

Make sure you have installed:

- Node.js (recommended: latest LTS)
- pnpm
- Docker

## Setup

Clone the repository:

```bash
git clone <your-repo-url>
cd bookly
```

Install dependencies:

```bash
pnpm install
```

## Start the database

Create and initialize the database containers:

```bash
pnpm db:reset
```

Seed the database with sample data:

```bash
pnpm db:seed
```

## Run the application

Start development servers:

```bash
pnpm dev
```

## Useful commands

Type-check the project:

```bash
pnpm typecheck
```

Reseed the database:

```bash
pnpm db:seed
```

Seed only book data:

```bash
pnpm db:seed:books
```

Reset the database:

```bash
pnpm db:reset
```

## Development flow

For a fresh setup:

```bash
pnpm install
pnpm db:reset
pnpm db:seed
pnpm dev
```