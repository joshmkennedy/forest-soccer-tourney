import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.NODE_ENV === "production"
    ? (process.env.DATABASE_URL ?? process.env.LOCAL_DATABASE_URL)
    : (process.env.LOCAL_DATABASE_URL ?? process.env.DATABASE_URL);
const isNeonUrl = databaseUrl?.includes(".neon.tech") ?? false;

const createPrismaClient = () => {
  if (isNeonUrl) {
    return new PrismaClient({
      adapter: new PrismaNeon({ connectionString: databaseUrl }),
    });
  }

  if (!databaseUrl) {
    throw new Error("Set LOCAL_DATABASE_URL or DATABASE_URL before using Prisma.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
