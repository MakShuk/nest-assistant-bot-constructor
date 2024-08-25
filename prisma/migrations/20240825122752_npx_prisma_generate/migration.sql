-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_vector_store" (
    "openai_vector_store_id" TEXT NOT NULL PRIMARY KEY,
    "telegram_user_id" TEXT NOT NULL,
    "openai_assistant_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vector_store_telegram_user_id_fkey" FOREIGN KEY ("telegram_user_id") REFERENCES "users" ("telegram_user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vector_store_openai_assistant_id_fkey" FOREIGN KEY ("openai_assistant_id") REFERENCES "assistants" ("openai_assistant_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_vector_store" ("created_at", "openai_assistant_id", "openai_vector_store_id", "telegram_user_id") SELECT "created_at", "openai_assistant_id", "openai_vector_store_id", "telegram_user_id" FROM "vector_store";
DROP TABLE "vector_store";
ALTER TABLE "new_vector_store" RENAME TO "vector_store";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
