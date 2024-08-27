import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AssistantsService } from 'src/assistants/assistants.service';
import { ThreadsService } from 'src/threads/threads.service';
import { Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import * as path from 'path';
import axios from 'axios';
import * as fs from 'fs';
import { unlink } from 'fs/promises';
import { OggConverter } from './ogg-converter.service';

@Injectable()
export class CommandsService {
  constructor(
    private readonly assistant: AssistantsService,
    private readonly thread: ThreadsService,
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

  streamText = async (
    ctx: Context,
    botMessage?: Message.TextMessage,
    text?: string,
  ) => {
    try {
      const message =
        'text' in ctx.message ? ctx.message.text : text.length > 0 ? text : '';

      const userId = `${ctx.from.id}`;

      const { openaiAssistantId } =
        await this.assistant.getLastAssistantByUserId(userId);
      const { openaiThreadId } =
        await this.thread.getLastThreadByUserId(userId);

      await this.thread.addMessageToThread(openaiThreadId, message);

      let sendMessage =
        botMessage || (await ctx.reply('🔄 Подождите, ответ формируется...'));

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

      await unlink(`${audioFolderPath}/${ctx.from.id}.mp3`);
      await this.editMessageTextWithFallback(
        ctx,
        message,
        'Обработка аудио завершена',
      );

      await this.streamText(ctx, message, text);
    } catch (error) {
      console.error('Error in audioMessage method:', error);
      return ctx.reply('⚠️ Произошла ошибка при обработке аудиосообщения');
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
      await unlink(inputFile);
    } catch (error) {
      console.error('Error in covertToMp3 method:', error);
      throw new Error('⚠️ Произошла ошибка при конвертации аудиосообщения');
    }
  }
}
