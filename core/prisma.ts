import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Single Prisma client for the whole app, reused by every module.
// Avoids opening a new connection on every import.
const connectionString = process.env.DATABASE_URL!;

const adapter = new PrismaPg({
  connectionString,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

export const prisma = new PrismaClient({ adapter });
