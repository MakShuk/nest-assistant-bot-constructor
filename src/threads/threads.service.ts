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
    const user = await this.prisma.user.findUnique({
      where: { telegramUserId: userId },
    });

    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const thread = await this.openai.beta.threads.create({
      messages: [],
    });
    await this.prisma.thread.create({
      data: {
        openaiThreadId: thread.id,
        telegramUserId: userId,
      },
    });
    return thread.id;
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
    const threadFile = await this.prisma.file.findMany({
      where: {
        threadId: threadId,
      },
    });

    for (const file of threadFile) {
      await this.openai.files.del(file.openaiFileId);
      await this.prisma.file.delete({
        where: {
          openaiFileId: file.openaiFileId,
        },
      });
    }

    const threadAi = await this.openai.beta.threads.del(threadId);
    const threadDB = await this.prisma.thread.delete({
      where: {
        openaiThreadId: threadId,
      },
    });
    return `Thread ${threadAi.id} deleted from OpenAI and ${threadDB.openaiThreadId} deleted from DB`;
  }

  async addMessageToThread(openaiThreadId: string, message: string) {
    return await this.openai.beta.threads.messages.create(openaiThreadId, {
      role: 'user',
      content: message,
    });
  }

  async addImageMessagesToThread(
    openaiThreadId: string,
    message: string,
    fileId: string,
  ) {
    return await this.openai.beta.threads.messages.create(openaiThreadId, {
      role: 'user',
      content: [
        {
          type: 'text',
          text: message,
        },
        {
          type: 'image_file',
          image_file: { file_id: fileId },
        },
      ],
    });
  }

  async getLastThreadByUserId(userId: string) {
    const thread = await this.prisma.thread.findFirst({
      where: {
        telegramUserId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return thread;
  }

  async resetThread(userId: string) {
    const thread = await this.getLastThreadByUserId(userId);
    await this.openai.beta.threads.del(thread.openaiThreadId);
    await this.prisma.thread.delete({
      where: {
        openaiThreadId: thread.openaiThreadId,
      },
    });
    await this.createThread(userId);
    return `Thread for user ${userId} reset`;
  }
}
