import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from 'src/services/prisma.service';

@Injectable()
export class ThreadsService {
  constructor(
    @Inject('OPENAI_INSTANCE') private readonly openai: OpenAI,
    private readonly prisma: PrismaService,
  ) {}

  async createThread(userId: string) {
    const thread = await this.openai.beta.threads.create({
      messages: [],
    });
    const threadDb = await this.prisma.thread.create({
      data: {
        openaiThreadId: thread.id,
        telegramUserId: userId,
      },
    });
    return `Thread ${threadDb.openaiThreadId} created for user ${threadDb.telegramUserId}`;
  }

  async getThreadById(threadId: string) {
    return await this.openai.beta.threads.retrieve(threadId);
  }

  async getAllThreadsForUserId(userId: string) {
    return await this.prisma.thread.findMany({
      where: {
        telegramUserId: userId,
      },
    });
  }

  async deleteThread(threadId: string) {
    const threadAi = await this.openai.beta.threads.del(threadId);
    const threadDB = await this.prisma.thread.delete({
      where: {
        openaiThreadId: threadId,
      },
    });
    return `Thread ${threadAi.id} deleted from OpenAI and ${threadDB.openaiThreadId} deleted from DB`;
  }
}
