import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ensure Package table exists in SQLite database automatically on startup
async function initDb() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Package" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "price" REAL NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'UGX',
        "interval" TEXT NOT NULL DEFAULT 'MONTHLY',
        "description" TEXT,
        "features" TEXT,
        "resolution" TEXT NOT NULL DEFAULT '1080p Full HD',
        "screens" INTEGER NOT NULL DEFAULT 2,
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn('Package table initialization warning:', err.message);
  }
}

initDb();

export default prisma;
