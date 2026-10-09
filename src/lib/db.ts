import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import { env } from "./env";
import { createPrismaClient } from "./prisma-client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Single client per process; reused across hot reloads in development. */
export const db = globalForPrisma.prisma ?? createPrismaClient(env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
