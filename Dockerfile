# Используем образ node версии 20 как базовый для этапа сборки
FROM node:20 as build

# Устанавливаем переменную окружения NODE_ENV
ENV NODE_ENV=production

# Устанавливаем рабочую директорию в контейнере
WORKDIR /opt/app/

# Копируем файлы package.json и package-lock.json (если есть)
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

# Устанавливаем переменную окружения NODE_ENV
ENV NODE_ENV=production

# Устанавливаем OpenSSL и другие необходимые пакеты
RUN apt-get update -y && apt-get install -y openssl libssl-dev

# Устанавливаем рабочую директорию в контейнере
WORKDIR /opt/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем только продакшн-зависимости
RUN npm ci --only=production

# Копируем собранный код и необходимые файлы из предыдущего этапа
COPY --from=build /opt/app/dist ./dist
COPY --from=build /opt/app/.env ./.env
COPY --from=build /opt/app/prisma ./prisma
COPY --from=build /opt/app/node_modules/.prisma ./node_modules/.prisma

# Создаем папку temp в директории dist
RUN mkdir -p ./dist/temp

# Устанавливаем URL базы данных для Prisma
RUN echo 'DATABASE_URL="file:./dev.db"' >> .env

# Генерируем Prisma Client в продакшн-среде
RUN npx prisma generate

# Выполняем миграции Prisma
RUN npx prisma migrate deploy

# Запускаем приложение
CMD ["node", "./dist/main.js"]