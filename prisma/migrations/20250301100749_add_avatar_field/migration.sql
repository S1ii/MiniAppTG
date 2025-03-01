/*
  Warnings:

  - Added the required column `anonymousName` to the `BotUser` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BotUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anonymousName" TEXT NOT NULL,
    "avatar" TEXT
);
INSERT INTO "new_BotUser" ("chatId", "createdAt", "firstName", "id", "lastSeen", "username") SELECT "chatId", "createdAt", "firstName", "id", "lastSeen", "username" FROM "BotUser";
DROP TABLE "BotUser";
ALTER TABLE "new_BotUser" RENAME TO "BotUser";
CREATE UNIQUE INDEX "BotUser_chatId_key" ON "BotUser"("chatId");
CREATE UNIQUE INDEX "BotUser_anonymousName_key" ON "BotUser"("anonymousName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
