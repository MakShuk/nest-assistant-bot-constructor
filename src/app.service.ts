import { Injectable, OnModuleInit } from '@nestjs/common';
import { TelegrafService } from './telegraf/telegraf.service';
import { CommandsService } from './services/commands.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly telegraf: TelegrafService,
    private readonly commands: CommandsService,
  ) {}

  onModuleInit() {
    console.log('The module has been initialized.');
    this.telegraf.createCommand('start', this.commands.start);
    this.telegraf.createCommand('reset', this.commands.reset);
    this.telegraf.textMessage(this.commands.streamText);
    this.telegraf.voiceMessage(this.commands.voiceMessage);

    /*   async init(userId: string, assistantName: string, instructions: string) {
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
    } */
  }
}
