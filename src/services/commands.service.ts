import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AssistantsService } from 'src/assistants/assistants.service';
import { ThreadsService } from 'src/threads/threads.service';
import { Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class CommandsService {
  constructor(
    private readonly assistant: AssistantsService,
    private readonly thread: ThreadsService,
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

  streamText = async (ctx: Context) => {
    try {
      if (!('text' in ctx.message)) return;
      const userId = `${ctx.from.id}`;
      const message = ctx.message.text;

      const { openaiAssistantId } =
        await this.assistant.getLastAssistantByUserId(userId);
      const { openaiThreadId } =
        await this.thread.getLastThreadByUserId(userId);

      await this.thread.addMessageToThread(openaiThreadId, message);

      let sendMessage = await ctx.reply('🔄 Подождите, ответ формируется...');

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

        console.log(process.env.SAVE_CONTEXT);
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
}
