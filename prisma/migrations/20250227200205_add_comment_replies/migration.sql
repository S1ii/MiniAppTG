-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "gossipId" TEXT NOT NULL,
    "replyToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Comment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Comment_gossipId_fkey" FOREIGN KEY ("gossipId") REFERENCES "Gossip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("authorId", "authorUsername", "content", "createdAt", "gossipId", "id") SELECT "authorId", "authorUsername", "content", "createdAt", "gossipId", "id" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE INDEX "Comment_gossipId_idx" ON "Comment"("gossipId");
CREATE INDEX "Comment_replyToId_idx" ON "Comment"("replyToId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
