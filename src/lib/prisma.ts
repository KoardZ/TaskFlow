import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbInitialized: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Ensures that all necessary SQLite tables exist upon first API access.
 * Runs once per server process using idempotent CREATE TABLE IF NOT EXISTS.
 */
export async function ensureDatabase() {
  if (globalForPrisma.dbInitialized) return;

  try {
    // 1. Create Ticket table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Ticket" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "ticketNumber" INTEGER NOT NULL UNIQUE,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
        "status" TEXT NOT NULL DEFAULT 'BACKLOG',
        "stagingUrl" TEXT,
        "releaseNote" TEXT,
        "reviewToken" TEXT NOT NULL UNIQUE,
        "readyAt" DATETIME,
        "reviewedAt" DATETIME,
        "reviewerName" TEXT,
        "reviewerPicture" TEXT,
        "reviewerLineId" TEXT,
        "rejectionReason" TEXT,
        "createdBy" TEXT NOT NULL DEFAULT 'DEV',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create Attachment table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Attachment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "ticketId" TEXT NOT NULL,
        "fileUrl" TEXT NOT NULL,
        "fileName" TEXT NOT NULL,
        "fileType" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Attachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // 3. Create ActivityLog table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ActivityLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "ticketId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "actor" TEXT NOT NULL,
        "details" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ActivityLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // 4. Create SystemSetting table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemSetting" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
        "projectName" TEXT NOT NULL DEFAULT 'TaskFlow',
        "defaultStagingUrl" TEXT,
        "lineChannelToken" TEXT,
        "lineGroupId" TEXT,
        "liffId" TEXT,
        "adminPasscode" TEXT NOT NULL DEFAULT 'admin1234',
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    globalForPrisma.dbInitialized = true;
  } catch (err) {
    console.error('ensureDatabase error:', err);
  }
}
