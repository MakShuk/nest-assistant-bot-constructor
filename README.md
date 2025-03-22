# Telegram Bot Constructor

Проект представляет собой конструктор Telegram ботов с использованием NestJS и Docker. Каждый бот работает в отдельном контейнере и имеет свою специализированную функциональность.

## Структура проекта

Проект использует Docker Compose версии 3.8 для управления несколькими контейнерами ботов. Все боты работают в одной сети `home` и имеют доступ к общим ресурсам.

## Список ботов

1. **ObsidianTagBot** (Порт: 4001)
   - Бот для работы с тегами Obsidian
   - Поддержка работы с файлами

2. **RestClientBot** (Порт: 4002)
   - Бот для тестирования REST API запросов

3. **MarkdownFormatExpertBot** (Порт: 4003)
   - Бот для форматирования Markdown
   - Поддержка работы с файлами и изображениями

4. **OrphoTextCorrectorBot** (Порт: 4004)
   - Бот для исправления орфографических ошибок
   - Поддержка голосовых сообщений

5. **ChatGPT-51Bot** (Порт: 4005)
   - Расширенный чат-бот с GPT
   - Поддержка голосовых сообщений, изображений и файлов
   - Сохранение контекста разговора
   - Векторное хранилище для файлов

6. **PlanTaskHelperBot** (Порт: 4006)
   - Бот для планирования задач
   - Поддержка голосовых сообщений

7. **CommitCrafterBot** (Порт: 4007)
   - Бот для создания commit сообщений
   - Поддержка голосовых сообщений

8. **EmojiMasterBot** (Порт: 4008)
   - Бот для работы с эмодзи
   - Поддержка голосовых сообщений и файлов

## Настройка и запуск

1. Создайте файл `.env` в корневой директории проекта
2. Скопируйте необходимые переменные окружения для каждого бота
3. Запустите контейнеры:
```bash
docker-compose up -d
```

## Переменные окружения

Каждый бот требует следующие базовые переменные окружения:

- `TELEGRAM_BOT_TOKEN` - Токен бота Telegram
- `PROJECT_NAME` - Название проекта
- `ASSISTANT_ID` - ID ассистента OpenAI

Дополнительные переменные:

- `FILE_ON` - Включение поддержки файлов (true/false)
- `IMAGE_ON` - Включение поддержки изображений (true/false)
- `VOICE_ON` - Включение поддержки голосовых сообщений (true/false)
- `SAVE_CONTEXT` - Сохранение контекста разговора (true/false)
- `FILE_MODE` - Режим работы с файлами ("VECTOR" для векторного хранилища)

## Сеть

Все боты работают в сети `home` с драйвером `bridge`. Это обеспечивает изоляцию и безопасное взаимодействие между контейнерами.

## Порты

Каждый бот использует свой порт для работы:

- ObsidianTagBot: 4001
- RestClientBot: 4002
- MarkdownFormatExpertBot: 4003
- OrphoTextCorrectorBot: 4004
- ChatGPT-51Bot: 4005
- PlanTaskHelperBot: 4006
- CommitCrafterBot: 4007
- EmojiMasterBot: 4008

## Примеры конфигурации

### Dockerfile

```dockerfile
# Используем образ node версии 20 как базовый для этапа сборки
FROM node:20 as build

# Устанавливаем переменную окружения NODE_ENV
ENV NODE_ENV=production

# Устанавливаем рабочую директорию в контейнере
WORKDIR /opt/app/

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости, включая devDependencies
RUN npm ci

# Устанавливаем NestJS CLI глобально
RUN npm install -g @nestjs/cli

# Копируем остальные файлы проекта
COPY . .

# Копируем файл .env.production
COPY .env.production .env

# Запускаем сборку проекта
RUN npm run build

# Генерируем Prisma Client
RUN npx prisma generate

# Используем образ node версии 20 как базовый для финального этапа
FROM node:20-slim

ENV NODE_ENV=production

# Устанавливаем OpenSSL и другие необходимые пакеты
RUN apt-get update -y && apt-get install -y openssl libssl-dev

WORKDIR /opt/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем только продакшн-зависимости
RUN npm ci --only=production

# Копируем собранный код и необходимые файлы
COPY --from=build /opt/app/dist ./dist
COPY --from=build /opt/app/.env ./.env
COPY --from=build /opt/app/prisma ./prisma
COPY --from=build /opt/app/node_modules/.prisma ./node_modules/.prisma

# Создаем папку temp
RUN mkdir -p ./temp

# Настройка Prisma
RUN echo 'DATABASE_URL="file:./dev.db"' >> .env
RUN npx prisma migrate dev --name init
RUN npx prisma generate
RUN mkdir -p ./prisma && touch ./prisma/dev.db && npx prisma migrate deploy

# Запускаем приложение
CMD ["node", "./dist/main.js"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  bot-1:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ObsidianTagBot
    ports:
      - 4001:4001
    restart: always
    networks:
      - home
    environment:
      - TELEGRAM_BOT_TOKEN=72****
      - PROJECT_NAME=ObsdianTagBot
      - ASSISTANT_ID=asst_ID***
      - FILE_ON=true

  bot-2:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: RestClientBot
    ports:
      - 4002:4002
    restart: always
    networks:
      - home
    environment:
      - TELEGRAM_BOT_TOKEN=74**
      - PROJECT_NAME=RestClientBot
      - ASSISTANT_ID=asst_***

  # ... Остальные боты конфигурируются аналогично

networks:
  home:
    driver: bridge
```

Полный пример конфигурации включает все 8 ботов с их специфическими настройками и переменными окружения. Для краткости здесь показаны только первые два бота.