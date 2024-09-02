import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AssistantsService } from 'src/assistants/assistants.service';
import { ThreadsService } from 'src/threads/threads.service';
import { Context, Markup } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import * as path from 'path';
import axios from 'axios';
import * as fs from 'fs';
import { OggConverter } from './ogg-converter.service';
import { VectorStoresService } from 'src/vector-stores/vector-stores.service';

@Injectable()
export class CommandsService {
  constructor(
    private readonly assistant: AssistantsService,
    private readonly thread: ThreadsService,
    private readonly vector: VectorStoresService,
    private oggConverter: OggConverter,
    @Inject('OPENAI_INSTANCE') private readonly openai: OpenAI,
  ) {}

  start = async (ctx: Context) => {
    return ctx.reply(`Команды бота:
       /start - Открывает главное меню помощника.
       /reset - Сбрасывает текущее состояние`);
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

      const response = await axios({
        method: 'get',
        url: String(fileLink),
        responseType: 'stream',
      });

      const writer = fs.createWriteStream(
        `${audioFolderPath}/${ctx.from.id}.ogg`,
      );

      await new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

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

      const userId = `${ctx.from.id}`;
      const photos = ctx.message.photo;
      const highestQualityPhoto = photos[photos.length - 1];
      const file = await ctx.telegram.getFile(highestQualityPhoto.file_id);
      const fileLink = await ctx.telegram.getFileLink(file.file_id);

      const { openaiThreadId } =
        await this.thread.getLastThreadByUserId(userId);
      await this.thread.addImageMessagesToThread(
        openaiThreadId,
        'Расскажи что на изображении',
        `${fileLink}`,
      );

      const userMessage = ctx.message.caption || 'Расскажи что на изображении';

      const message = await ctx.reply(
        '🔄 Подождите, идет обработка изображения...',
      );

      await this.streamText(ctx, userMessage, message);
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

      await this.downloadFile(`${link}`, filePath);
      const file = fs.readFileSync(filePath, 'utf8');

      await this.streamText(
        ctx,
        `Пришли мне список тегов: ${file}`,
        sendMessage,
      );
      await this.deleteFile(filePath);
    } catch (error) {
      console.error('Error in fileOneAnswer method:', error);
      return ctx.reply('⚠️ Произошла ошибка при обработке файла');
    }
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

    if ('error' in editMessage) {
      editMessage = await this.editMessageText(ctx, oldMessage, newMessage);
    }

    if ('error' in editMessage) {
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
      const writer = fs.createWriteStream(outputLocationPath);

      const response = await axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream',
      });

      return new Promise<{ data: string } | { errorMessages: string }>(
        (resolve, reject) => {
          response.data.pipe(writer);
          let error: null | Error = null;
          writer.on('error', (err) => {
            error = err;
            writer.close();
            reject({ errorMessages: '⚠️ Произошла ошибка при загрузке файла' });
          });
          writer.on('close', () => {
            if (!error) {
              resolve({ data: 'Файл успешно загружен' });
            }
          });
        },
      );
    } catch (error) {
      console.error('Error in downloadFile method:', error);
      throw new Error('⚠️ Произошла ошибка при загрузке файла');
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
