import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/lib/generated/prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function toLibsqlUrl(raw: string): string {
  if (raw.startsWith("file:./") || raw.startsWith("file:.\\")) {
    return `file:${path.resolve(process.cwd(), raw.slice(7).replace(/\\/g, "/"))}`;
  }
  if (raw.startsWith("file:") && !raw.startsWith("file:/")) {
    return `file:${path.resolve(process.cwd(), raw.slice(5))}`;
  }
  return raw;
}

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL ?? "file:dev.db";
  const url = toLibsqlUrl(rawUrl);
  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter } as never);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
