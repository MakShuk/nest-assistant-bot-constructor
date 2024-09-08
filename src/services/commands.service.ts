import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AssistantsService } from 'src/assistants/assistants.service';
import { ThreadsService } from 'src/threads/threads.service';
import { Context, Markup } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import * as path from 'path';
import * as fs from 'fs';
import fetch from 'node-fetch';
import { OggConverter } from './ogg-converter.service';
import { VectorStoresService } from 'src/vector-stores/vector-stores.service';
import { FilesService } from 'src/files/files.service';

@Injectable()
export class CommandsService {
  constructor(
    private readonly assistant: AssistantsService,
    private readonly thread: ThreadsService,
    private readonly vector: VectorStoresService,
    private readonly files: FilesService,
    private oggConverter: OggConverter,
    @Inject('OPENAI_INSTANCE') private readonly openai: OpenAI,
  ) {}

  start = async (ctx: Context) => {
    return ctx.reply(`Команды бота:
       /start - Открывает главное меню помощника.
       /reset - Сбрасывает текущее состояние`);
  };

  disable = async (ctx: Context) => {
    return ctx.reply(`Функция не доступна для этого бота`);
  };

  reset = async (ctx: Context) => {
    return ctx.reply(
      `Ручной сброс состояния не требуется, бот автоматически сбрасывает состояние после завершения диалога.`,
    );
  };

  store = async (ctx: Context) => {
    const vectorStores = await this.vector.getLastVectorStore();

    if (!vectorStores) {
      return ctx.reply(`Хранилище не найдено`);
    }

    const menu = Markup.button.callback(`🗑️ Удалить`, 'store');
    return ctx.reply(
      `Используется хранилище: ${vectorStores.openaiVectorStoreId}`,
      Markup.inlineKeyboard([menu]),
    );
  };

  streamText = async (
    ctx: Context,
    text?: string,
    botMessage?: Message.TextMessage,
  ) => {
    try {
      const message =
        'text' in ctx.message ? ctx.message.text : text.length > 0 ? text : '';

      const userId = `${ctx.from.id}`;

      const { openaiAssistantId } = await this.assistant.getLastAssistant();

      let openaiThreadId: string;
      const thread = await this.thread.getLastThreadByUserId(userId);
      if (!thread) {
        openaiThreadId = await this.thread.createThread(userId);
      } else {
        openaiThreadId = thread.openaiThreadId;
      }

      await this.thread.addMessageToThread(openaiThreadId, message);

      let sendMessage;
      if (typeof botMessage !== 'undefined') {
        sendMessage = botMessage;
      } else {
        sendMessage = await ctx.reply('🔄 Подождите, ответ формируется...');
      }

      const run = this.openai.beta.threads.runs.stream(openaiThreadId, {
        assistant_id: openaiAssistantId,
      });

      run.on('error', async (error) =>
        this.editMessageText(
          ctx,
          sendMessage,
          `⚠️ Произошла ошибка при обработке запроса: ${error.message}`,
        ),
      );

      let textInStream = ``;
      let lastCallTime = Date.now();

      let messagesSplit: string[] = [];

      run.on('textDelta', async (textDelta) => {
        textInStream += textDelta.value || '';
        const currentTime = Date.now();
        messagesSplit = this.splitMessage(textInStream, 3900);
        if (
          currentTime - lastCallTime >
          Number(process.env.CHAT_UPDATE_INTERVAL)
        ) {
          lastCallTime = currentTime;
          if (messagesSplit.length > 1) {
            messagesSplit = this.splitMessage(textInStream, 3900);
            await this.editMessageText(ctx, sendMessage, messagesSplit[0]);
            sendMessage = await ctx.reply(`Обработка сообщения...`);
            textInStream = messagesSplit[1];
          } else {
            await this.editMessageTextWithFallback(
              ctx,
              sendMessage,
              messagesSplit[0],
            );
          }
        }
      });
      run.on('error', async (error) =>
        this.editMessageText(
          ctx,
          sendMessage,
          `⚠️ Произошла ошибка при обработке запроса: ${error.message}`,
        ),
      );
      run.on('end', async () => {
        await this.editMessageTextWithFallback(ctx, sendMessage, textInStream);
        process.env.SAVE_CONTEXT === 'ON'
          ? null
          : await this.thread.resetThread(userId);
      });
    } catch (error) {
      const errorMessage = `⚠️ Произошла ошибка при обработке запроса: ${error.message}`;
      console.error(errorMessage);
      return ctx.reply(errorMessage);
    }
  };

  voiceMessage = async (ctx: Context) => {
    try {
      if (!('voice' in ctx.message)) return;
      const message = await ctx.reply('🔄 Подождите, идет обработка аудио...');

      const audioFolderPath = path.join(__dirname, '..', '..', 'temp');
      const fileId = ctx.message.voice?.file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const userId = ctx.from.id;

      await this.downloadFile(
        String(fileLink),
        `${audioFolderPath}/${ctx.from.id}.ogg`,
      );

      await this.covertToMp3(String(userId));

      const readStream = fs.createReadStream(
        `${audioFolderPath}/${ctx.from.id}.mp3`,
      );

      const { text } = await this.openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: readStream,
      });

      await this.deleteFile(`${audioFolderPath}/${ctx.from.id}.mp3`);
      await this.editMessageTextWithFallback(
        ctx,
        message,
        'Обработка аудио завершена',
      );

      await this.streamText(ctx, text, message);
    } catch (error) {
      console.error('Error in audioMessage method:', error);
      return ctx.reply('⚠️ Произошла ошибка при обработке аудиосообщения');
    }
  };

  imageMessage = async (ctx: Context) => {
    try {
      if (!('photo' in ctx.message)) return;

      const sendMessage = await ctx.reply(
        '🔄 Подождите, идет обработка фото...',
      );

      const userId = `${ctx.from.id}`;
      const photos = ctx.message.photo;
      const highestQualityPhoto = photos[photos.length - 1];
      const file = await ctx.telegram.getFile(highestQualityPhoto.file_id);
      const link = await ctx.telegram.getFileLink(file.file_id);
      const fileExtension = file.file_path.split('.').pop();

      const basePath = path.resolve(__dirname, '..', '../temp/');
      const filePath = path.join(
        basePath,
        `${process.env.PROJECT_NAME}-${ctx.from.id}.${fileExtension}`,
      );

      console.log(`Пытаюсь загрузить файл: ${link.href}`);
      console.log(`userId: ${userId}`);

      console.log(file);

      await this.editMessageTextWithFallback(
        ctx,
        sendMessage,
        '🔄 Файл загружается...',
      );

      const fileSaveStatus = await this.downloadFile(`${link}`, filePath);

      if ('errorMessages' in fileSaveStatus) {
        return ctx.reply(fileSaveStatus.errorMessages);
      }

      const lastThread = await this.thread.getLastThreadByUserId(userId);
      const createOpenaiFile = await this.files.createImageFile(
        lastThread.openaiThreadId,
        filePath,
      );

      console.log(`Добавляю файл в тред: ${createOpenaiFile.threadId}`);
      await this.thread.addImageMessagesToThread(
        lastThread.openaiThreadId,
        ctx.message.caption || `Фото от пользователя ${userId}`,
        createOpenaiFile.openaiFileId,
      );

      console.log(`Удаляю файл: ${filePath}`);
      const deleteFileStatus = await this.deleteFile(filePath);

      if ('errorMessages' in deleteFileStatus) {
        return this.editMessageTextWithFallback(
          ctx,
          sendMessage,
          deleteFileStatus.errorMessages,
        );
      }

      if (ctx.message.caption) {
        return await this.streamText(ctx, ctx.message.caption, sendMessage);
      } else {
        return await this.editMessageTextWithFallback(
          ctx,
          sendMessage,
          '✅  Фото успешно обработано, задайте вопрос',
        );
      }
    } catch (error) {
      console.error('Ошибка при обработке фотографии:', error);
      await ctx.reply('Произошла ошибка при обработке фотографии.');
    }
  };

  fileMessage = async (ctx: Context) => {
    try {
      if (!('document' in ctx.message)) return;

      const sendMessage = await ctx.reply(
        '🔄 Подождите, идет обработка файла...',
      );
      const fileId = ctx.message.document.file_id;
      const fileName = ctx.message.document.file_name;
      const fileExtension = fileName.split('.').pop();

      const link = await ctx.telegram.getFileLink(fileId);
      const basePath = path.resolve(__dirname, '..', '../temp/');
      const filePath = path.join(
        basePath,
        `${process.env.PROJECT_NAME}-${ctx.from.id}.${fileExtension}`,
      );

      await this.editMessageTextWithFallback(
        ctx,
        sendMessage,
        '🔄 Файл загружается...',
      );

      const fileSaveStatus = await this.downloadFile(`${link}`, filePath);

      if ('errorMessages' in fileSaveStatus) {
        return ctx.reply(fileSaveStatus.errorMessages);
      }

      const vectorStores = await this.vector.getLastVectorStore();
      const assistant = await this.assistant.getLastAssistant();

      await this.editMessageTextWithFallback(
        ctx,
        sendMessage,
        '🔄 Файл загружен, обрабатывается...',
      );

      if (!vectorStores) {
        const vectorStoreId = await this.vector.createVectorStore([filePath]);
        await this.assistant.addVectorStoreToAssistant(
          vectorStoreId,
          assistant.openaiAssistantId,
        );
      } else {
        await this.vector.addFileToVectorStore(
          vectorStores.openaiVectorStoreId,
          filePath,
        );
      }

      const deleteFileStatus = await this.deleteFile(filePath);

      if ('errorMessages' in deleteFileStatus) {
        return this.editMessageTextWithFallback(
          ctx,
          sendMessage,
          deleteFileStatus.errorMessages,
        );
      }

      return await this.editMessageTextWithFallback(
        ctx,
        sendMessage,
        '✅ Файл успешно обработан',
      );
    } catch (error) {
      console.error('Error in file method:', error);
      return ctx.reply(
        `⚠️ Произошла ошибка при обработке файла: ${error.message}`,
      );
    }
  };

  deleteStore = async (ctx: Context) => {
    try {
      const vectorStores = await this.vector.getLastVectorStore();

      if (!vectorStores) {
        return ctx.reply(`Хранилище не найдено`);
      }

      await this.vector.deleteVectorStore(vectorStores.openaiVectorStoreId);

      return ctx.reply(`Хранилище ${vectorStores.openaiVectorStoreId} удалено`);
    } catch (error) {
      console.error('Error in deleteStore method:', error);
      return ctx.reply(`⚠️ Произошла ошибка при удалении хранилища: ${error}`);
    }
  };

  fileOneAnswer = async (ctx: Context) => {
    try {
      if (!('document' in ctx.message)) return;

      const sendMessage = await ctx.reply(
        '🔄 Подождите, идет обработка файла...',
      );
      const fileId = ctx.message.document.file_id;
      const fileName = ctx.message.document.file_name;
      const fileExtension = fileName.split('.').pop();

      const link = await ctx.telegram.getFileLink(fileId);
      const basePath = path.resolve(__dirname, '..', '../temp/');
      const filePath = path.join(
        basePath,
        `${process.env.PROJECT_NAME}-${ctx.from.id}.${fileExtension}`,
      );

      await this.editMessageTextWithFallback(
        ctx,
        sendMessage,
        '🔄 Файл загружается...',
      );

      console.log(`Пытаюсь загрузить файл: ${link.href}`);
      await this.downloadFile(link.href, filePath);
      console.log(`Файл загружен: ${filePath}`);
      const file = fs.readFileSync(filePath, 'utf8');
      console.log(`Передаю информация в streamText`);
      await this.streamText(
        ctx,
        `Информация для обработки: ${file}`,
        sendMessage,
      );
      await this.deleteFile(filePath);
    } catch (error) {
      console.error('Error in fileOneAnswer method:', error);
      return ctx.reply('⚠️ Произошла ошибка при обработке файла');
    }
  };

  info = async (ctx: Context) => {
    const sendMessage = await ctx.reply(
      '🔄 Подождите, идет получение информации...',
    );

    const localAssistant = await this.assistant.getLastAssistant();

    const assistant = await this.assistant.getAssistantById(
      localAssistant.openaiAssistantId,
    );

    const message = `Информация о помощнике: 
    - Название: ${assistant.name}
    - Модель: ${assistant.model}
    - ID: ${assistant.id}
    - Инструкция: ${assistant.instructions}
    `;

    await this.editMessageTextWithFallback(ctx, sendMessage, message);
    return;
  };

  private splitMessage(message: string, limit = 4096) {
    const parts = [];
    while (message.length > 0) {
      if (message.length > limit) {
        let part = message.slice(0, limit);
        const cutAt = part.lastIndexOf(' ');
        part = part.slice(0, cutAt);
        parts.push(part);
        message = message.slice(cutAt);
      } else {
        parts.push(message);
        message = '';
      }
    }
    return parts;
  }

  private async editMessageText(
    ctx: Context,
    oldMessage: Message.TextMessage,
    newMessage: string,
    markdown = false,
    deleteMessage = false,
  ) {
    try {
      if (newMessage.trim() === '') return;
      if (oldMessage.text === newMessage) return;
      if (deleteMessage) {
        await ctx.telegram.deleteMessage(
          oldMessage.chat.id,
          oldMessage.message_id,
        );
        return;
      }
      await ctx.telegram.editMessageText(
        oldMessage.chat.id,
        oldMessage.message_id,
        null,
        newMessage,
        markdown ? { parse_mode: 'Markdown' } : {},
      );
      return { data: `Сообщение успешно отредактировано` };
    } catch (error) {
      const errorMessages = `⚠️ Произошла ошибка при редактировании сообщения: ${error.message}`;
      return { error: errorMessages };
    }
  }

  private async editMessageTextWithFallback(
    ctx: Context,
    oldMessage: Message.TextMessage,
    newMessage: string,
  ) {
    let editMessage = await this.editMessageText(
      ctx,
      oldMessage,
      newMessage,
      true,
    );

    if (oldMessage.text === newMessage) {
      console.log(
        'New message content is identical to the current message content. No changes needed.',
      );
      return;
    }

    if (editMessage && 'error' in editMessage) {
      editMessage = await this.editMessageText(ctx, oldMessage, newMessage);
    }

    if (editMessage && 'error' in editMessage) {
      await this.editMessageText(ctx, oldMessage, editMessage.error);
    }
  }

  private async covertToMp3(userId?: string) {
    try {
      const inputFile = path.join(
        __dirname,
        '..',
        '..',
        'temp',
        `${userId}.ogg`,
      );
      const outputFile = path.join(
        __dirname,
        '..',
        '..',
        'temp',
        `${userId}.mp3`,
      );
      await this.oggConverter.convertToMp3(inputFile, outputFile);
      await this.deleteFile(inputFile);
    } catch (error) {
      console.error('Error in covertToMp3 method:', error);
      throw new Error('⚠️ Произошла ошибка при конвертации аудиосообщения');
    }
  }

  private async downloadFile(fileUrl: string, outputLocationPath: string) {
    try {
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileUrl}: ${response.statusText}`);
      }

      const fileStream = fs.createWriteStream(outputLocationPath);
      response.body.pipe(fileStream);

      await new Promise((resolve, reject) => {
        fileStream.on('finish', () => resolve({ data: 'OK' }));
        fileStream.on('error', (error) =>
          reject({
            errorMessages: `Error in downloadFile method: ${error.message}`,
          }),
        );
      });

      return { data: `Файл успешно загружен` };
    } catch (error) {
      console.error('Error in downloadFile method:', error);
      return {
        errorMessages: `Error in downloadFile method: ${error.message}`,
      };
    }
  }

  private async deleteFile(filePath: string) {
    try {
      await fs.promises.unlink(filePath);
      return { data: 'Файл успешно удален' };
    } catch (error) {
      console.error('Error in deleteFile method:', error);
      return {
        errorMessages: `⚠️ Произошла ошибка при удалении файла ${error}`,
      };
    }
  }
}
