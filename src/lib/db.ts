import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Only instantiate when a real DATABASE_URL is configured.
export const prisma =
  process.env.DATABASE_URL || process.env.SUPABASE_URL
    ? (globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      }))
    : undefined;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.SUPABASE_URL);
}
