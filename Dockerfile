# Используем образ node версии 20 как базовый для этапа сборки
FROM node:20 as build
# Устанавливаем рабочую директорию в контейнере
WORKDIR /opt/app/
# Копируем файлы json (включая package.json) в рабочую директорию
ADD *.json ./
# Устанавливаем зависимости, указанные в package.json
RUN npm install
# Копируем остальные файлы в рабочую директорию
ADD . .
# Запускаем сборку проекта
RUN npm run build
# Копируем файл .env в директорию app
COPY .env app
# Копируем файл prisma в директорию app
FROM node:20
# Устанавливаем рабочую директорию в контейнере
WORKDIR /opt/app
# Копируем файл package.json в рабочую директорию
ADD package.json ./
# Устанавливаем только продакшн-зависимости
RUN npm install --only=prod
# Копируем собранный код из предыдущего этапа в директорию dist текущего контейнера
COPY --from=build /opt/app/dist  ./dist
# Создаем папку temp в директории dist
RUN mkdir -p ./temp
# Копируем файл .env из предыдущего этапа в текущий контейнер
COPY --from=build /opt/app/.env  ./
# Копируем файл prisma из предыдущего этапа в текущий контейнер 
COPY --from=build /opt/app/prisma  ./prisma
# Создаем миграцию
RUN npx prisma migrate deploy
# Генерируем Prisma Client
RUN npx prisma generate
# Запускаем приложение
CMD [ "NODE_ENV=production node", "./dist/main.js" ]

#docker image build -t telegram_bot_image .
#docker run --name news_bot -d telegram_bot_image:latest
