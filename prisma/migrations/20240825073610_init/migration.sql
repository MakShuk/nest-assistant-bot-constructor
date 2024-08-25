-- CreateTable
CREATE TABLE "users" (
    "telegram_user_id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "assistants" (
    "openai_assistant_id" TEXT NOT NULL PRIMARY KEY,
    "telegram_user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assistants_telegram_user_id_fkey" FOREIGN KEY ("telegram_user_id") REFERENCES "users" ("telegram_user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vector_store" (
    "openai_vector_store_id" TEXT NOT NULL PRIMARY KEY,
    "telegram_user_id" TEXT NOT NULL,
    "openai_assistant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vector_store_telegram_user_id_fkey" FOREIGN KEY ("telegram_user_id") REFERENCES "users" ("telegram_user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vector_store_openai_assistant_id_fkey" FOREIGN KEY ("openai_assistant_id") REFERENCES "assistants" ("openai_assistant_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "thread" (
    "openai_thread_id" TEXT NOT NULL PRIMARY KEY,
    "telegram_user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "thread_telegram_user_id_fkey" FOREIGN KEY ("telegram_user_id") REFERENCES "users" ("telegram_user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
