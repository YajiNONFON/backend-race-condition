# Race condition — bad vs good practice

Part of a backend concepts lab: each module implements the same feature
twice — once with a common bug, once fixed — so the difference can be
observed directly instead of just read about.

This module: a wallet withdrawal endpoint, implemented once with a
classic race condition bug, and once fixed with an atomic conditional
update.

## What this demonstrates

- **Bad implementation**: reads the balance, checks it, then writes the
  new balance — as two separate steps. Under concurrent requests, this
  allows a balance to go negative.
- **Good implementation**: checks and writes in a single atomic SQL
  statement (`UPDATE ... WHERE balance >= amount`), so the database
  itself guarantees no two requests can interleave.

See `TESTING.md` for how to reproduce both behaviors and what the results
mean.

## Structure

```
core/                     Express bootstrap, error handling, Prisma client
modules/race-condition/
  routes.ts                defines the URLs
  controller.ts             receives the HTTP request, calls the service
  service.bad.ts             buggy implementation
  service.good.ts            fixed implementation
  types.ts                   module types
prisma/schema.prisma       database schema
tools/concurrent-test.ts   automated concurrency test script
postman/collection.json    Postman collection for manual testing
docker-compose.yml         local Postgres in one command
```

## Setup

### 1. Prerequisites

- Node.js 18+
- Docker (for local Postgres) — or an existing Postgres instance

### 2. Install dependencies

```bash
npm install
```

### 3. Start the database

```bash
docker compose up -d
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

The defaults already match the provided `docker-compose.yml`.

### 5. Generate the Prisma client and run migrations

```bash
npm run prisma:migrate
npm run prisma:generate
```

### 6. Start the server

```bash
npm run dev
```

The server listens on `http://localhost:5000`. Verify with:

```bash
curl http://localhost:5000/health
```

## Next step

Once the server is running, go to `TESTING.md` to reproduce the bug and
the fix, either with the automated script, curl, or the Postman
collection.
