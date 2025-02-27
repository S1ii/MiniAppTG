/*
  Warnings:

  - You are about to drop the column `replyToId` on the `Comment` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gossipId" TEXT NOT NULL,
    CONSTRAINT "Comment_gossipId_fkey" FOREIGN KEY ("gossipId") REFERENCES "Gossip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("authorId", "authorUsername", "content", "createdAt", "gossipId", "id") SELECT "authorId", "authorUsername", "content", "createdAt", "gossipId", "id" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
