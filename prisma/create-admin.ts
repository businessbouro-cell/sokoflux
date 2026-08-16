import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";
import path from "path";

function toLibsqlUrl(raw: string): string {
  if (raw.startsWith("file:./") || raw.startsWith("file:.\\")) {
    return `file:${path.resolve(process.cwd(), raw.slice(7).replace(/\\/g, "/"))}`;
  }
  if (raw.startsWith("file:") && !raw.startsWith("file:/")) {
    return `file:${path.resolve(process.cwd(), raw.slice(5))}`;
  }
  return raw;
}

const rawUrl = process.env["DATABASE_URL"] ?? "file:dev.db";
const dbUrl = toLibsqlUrl(rawUrl);
const authToken = process.env["TURSO_AUTH_TOKEN"];

const adapter = new PrismaLibSql({ url: dbUrl, ...(authToken ? { authToken } : {}) });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  const adminPhone = process.env["ADMIN_PHONE"] ?? "+224600000000";
  const adminPassword = process.env["ADMIN_PASSWORD"] ?? "admin123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existing = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (existing) {
    console.log("✅ Admin existe déjà:", existing.phone);
    return;
  }

  const admin = await prisma.user.create({
    data: {
      phone: adminPhone,
      name: "Admin SokoFlux",
      passwordHash,
      isVerified: true,
      isActive: true,
      roles: { create: [{ role: "ADMIN" }] },
    },
  });

  console.log("✅ Admin créé:", admin.phone);
}

main().catch(console.error).finally(() => prisma.$disconnect());
