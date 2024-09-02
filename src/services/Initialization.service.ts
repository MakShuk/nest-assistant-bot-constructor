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
    const users = await this.user.getAllUsers();
    const assistantName = process.env.PROJECT_NAME;
    const instruction = process.env.INSTRUCTION;
    const usersForSettings = process.env.USERS
      ? JSON.parse(process.env.USERS)
      : [];

    if (!users.length) {
      console.log('Creating user');
      this.initializationUsers(usersForSettings);

      await this.assistant.createAssistant(assistantName, instruction);
    }
  }

  private async initializationUsers(users: string[]) {
    for (const user of users) {
      const newUser = await this.user.createUser(user);
      await this.thread.createThread(newUser.telegramUserId);
    }
  }
}
