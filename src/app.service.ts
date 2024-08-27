import { Inject, Injectable } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { ThreadsService } from './threads/threads.service';
import { AssistantsService } from './assistants/assistants.service';
import OpenAI from 'openai';
import { Context, Telegraf } from 'telegraf';

@Injectable()
export class AppService {
  constructor(
    private readonly usersService: UsersService,
    private readonly threadsService: ThreadsService,
    private readonly assistantsService: AssistantsService,
    @Inject('OPENAI_INSTANCE') private readonly openai: OpenAI,
    @Inject('TELEGRAM_BOT_INSTANCE') private readonly bot: Telegraf<Context>,
  ) {}

  async init(userId: string, assistantName: string, instructions: string) {
    const newUser = await this.usersService.createUser(
      `user-${userId}`,
      userId,
    );

    const thread = await this.threadsService.createThread(userId);
    const assistant = await this.assistantsService.createAssistant(
      assistantName,
      userId,
      instructions,
    );
    return { thread, assistant, newUser };
  }

  async stream(userId: string) {
    const { lastAssistantId, lastThreadId } =
      await this.usersService.getLastRecordsByUserId(userId);

    const run = this.openai.beta.threads.runs
      .stream(lastAssistantId, {
        assistant_id: lastThreadId,
      })
      .on('textCreated', () => process.stdout.write('\nassistant > '))
      .on('textDelta', (textDelta) => process.stdout.write(textDelta.value));
    console.log('run', run);
  }

  async sendMessage() {
    this.bot.start((ctx) => {
      ctx.reply('Welcome to the bot');
    });
  }
}
