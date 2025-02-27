/*
  Warnings:

  - You are about to alter the column `authorId` on the `Comment` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `authorId` on the `Gossip` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `userId` on the `Like` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorId" BIGINT NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gossipId" TEXT NOT NULL,
    CONSTRAINT "Comment_gossipId_fkey" FOREIGN KEY ("gossipId") REFERENCES "Gossip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("authorId", "authorUsername", "content", "createdAt", "gossipId", "id") SELECT "authorId", "authorUsername", "content", "createdAt", "gossipId", "id" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE TABLE "new_Gossip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorId" BIGINT NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Gossip" ("authorId", "authorUsername", "content", "createdAt", "id", "likes") SELECT "authorId", "authorUsername", "content", "createdAt", "id", "likes" FROM "Gossip";
DROP TABLE "Gossip";
ALTER TABLE "new_Gossip" RENAME TO "Gossip";
CREATE TABLE "new_Like" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    "gossipId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_gossipId_fkey" FOREIGN KEY ("gossipId") REFERENCES "Gossip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Like" ("createdAt", "gossipId", "id", "userId") SELECT "createdAt", "gossipId", "id", "userId" FROM "Like";
DROP TABLE "Like";
ALTER TABLE "new_Like" RENAME TO "Like";
CREATE UNIQUE INDEX "Like_userId_gossipId_key" ON "Like"("userId", "gossipId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
