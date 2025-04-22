# Конструктор Ассистент-Ботов на NestJS 🤖

| English  | [🇬🇧 Read in English](README.md) |

![Лицензия](https://img.shields.io/badge/license-MIT-blue)
![NestJS](https://img.shields.io/badge/NestJS-10.x-red)
![OpenAI](https://img.shields.io/badge/OpenAI-API-green)
![Telegram](https://img.shields.io/badge/Telegram-Bot-blue)

Мощный конструктор для создания AI ассистент-ботов на базе NestJS с интеграцией Telegram и OpenAI.

## Содержание
- [Возможности](#возможности)
- [Требования](#требования)
- [Установка](#установка)
- [Настройка](#настройка)
- [Использование](#использование)
- [API Документация](#api-документация)
- [Лицензия](#лицензия)

## Возможности

- 🤖 Создание и управление AI ассистентами через OpenAI API
- 💬 Интеграция с Telegram ботами
- 🗄️ Поддержка векторных хранилищ для эффективного поиска данных
- 📁 Система управления файлами
- 🔄 Управление потоками разговоров
- 🔐 Встроенная аутентификация и управление пользователями
- 🎯 RESTful API endpoints
- 📊 Prisma ORM для работы с базой данных

## Требования

- Node.js 18.x или выше
- PostgreSQL 12 или выше
- OpenAI API ключ
- Telegram Bot Token
- Docker (опционально, для контейнеризации)

## Установка

1. Клонируйте репозиторий:
```bash
git clone [repository-url]
cd nest-assistant-bot-constructor
```

2. Установите зависимости:
```bash
npm install
```

3. Настройте переменные окружения:
```bash
# Создайте файл .env и настройте переменные
cp .env.example .env
```

4. Запустите миграции базы данных:
```bash
npx prisma migrate dev
```

5. Запустите приложение:
```bash
# Разработка
npm run start:dev

# Продакшн
npm run build
npm run start:prod
```

## Настройка

### Переменные окружения

- `DATABASE_URL` - строка подключения к PostgreSQL
- `OPENAI_API_KEY` - ваш ключ OpenAI API
- `TELEGRAM_BOT_TOKEN` - токен вашего Telegram бота
- [Другие переменные конфигурации]

### Настройка OpenAI

Настройки OpenAI находятся в файле `src/configs/openai.config.ts`.

### Настройка Telegram

Настройки Telegram бота находятся в файле `src/configs/telegram.config.ts`.

## Использование

### Создание нового ассистента

```typescript
// Пример создания ассистента
POST /assistants
{
  "name": "MyAssistant",
  "model": "gpt-4",
  "instructions": "You are a helpful assistant..."
}
```

### Управление разговорами

```typescript
// Начать новый поток разговора
POST /threads
{
  "assistantId": "your-assistant-id"
}
```

## API Документация

API включает несколько модулей:

- `/assistants` - Управление AI ассистентами
- `/threads` - Управление потоками разговоров
- `/files` - Операции с файлами
- `/users` - Управление пользователями
- `/vector-stores` - Операции с векторными хранилищами

Для подробной документации API запустите сервер и перейдите по эндпоинту `/api`.

## Лицензия

Этот проект распространяется под лицензией MIT - подробности см. в файле [LICENSE](LICENSE).