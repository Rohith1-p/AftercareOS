import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Only instantiate when a real Postgres connection string is configured.
// NOTE: this must key off DATABASE_URL (the Postgres DSN), NOT SUPABASE_URL
// (the REST/Auth URL) — otherwise Prisma would instantiate without a valid url.
export const prisma = process.env.DATABASE_URL
  ? (globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      }))
  : undefined;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
