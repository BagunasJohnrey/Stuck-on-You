// lib/prisma.js
import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient instance across hot-reloads (dev) and
// serverless invocations to avoid exhausting the database connection pool.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
