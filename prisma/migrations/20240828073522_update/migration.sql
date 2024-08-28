/*
  Warnings:

  - You are about to drop the column `telegram_user_id` on the `assistants` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assistants" (
    "openai_assistant_id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_assistants" ("created_at", "openai_assistant_id") SELECT "created_at", "openai_assistant_id" FROM "assistants";
DROP TABLE "assistants";
ALTER TABLE "new_assistants" RENAME TO "assistants";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
