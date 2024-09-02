import { Injectable } from '@nestjs/common';
import { AssistantsService } from 'src/assistants/assistants.service';
import { ThreadsService } from 'src/threads/threads.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class InitializationService {
  constructor(
    private readonly assistant: AssistantsService,
    private readonly thread: ThreadsService,
    private readonly user: UsersService,
  ) {}

  async on() {
    try {
      const users = await this.user.getAllUsers();
      const formattedDate = new Date()
        .toLocaleDateString('ru-RU')
        .slice(0, -5)
        .replace(/\./g, '.');
      const assistantId = process.env.ASSISTANT_ID;
      const instruction = process.env.INSTRUCTION;
      const usersForSettings = process.env.USERS
        ? JSON.parse(process.env.USERS)
        : [];

      if (!users.length) {
        console.log('Creating user');
        this.initializationUsers(usersForSettings);

        await this.assistant.createAssistant(formattedDate, instruction);

        if (assistantId.length > 20) {
          await this.assistant.createAssistant(
            formattedDate,
            instruction,
            assistantId,
          );
        } else {
          await this.assistant.createAssistant(formattedDate, instruction);
        }
      }
    } catch (error) {
      console.error('Initialization error', error);
    }
  }

  private async initializationUsers(users: string[]) {
    for (const user of users) {
      const newUser = await this.user.createUser(user);
      await this.thread.createThread(newUser.telegramUserId);
    }
  }
}
