/*
  Warnings:

  - You are about to drop the column `anonymousName` on the `BotUser` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `BotUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Gossip" ADD COLUMN "title" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BotUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_BotUser" ("chatId", "createdAt", "firstName", "id", "lastSeen", "username") SELECT "chatId", "createdAt", "firstName", "id", "lastSeen", "username" FROM "BotUser";
DROP TABLE "BotUser";
ALTER TABLE "new_BotUser" RENAME TO "BotUser";
CREATE UNIQUE INDEX "BotUser_chatId_key" ON "BotUser"("chatId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
