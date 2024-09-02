import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return await this.prisma.user.findMany();
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        telegramUserId: id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(telegramUserId: string, username?: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        telegramUserId: telegramUserId,
      },
    });

    if (user) {
      throw new Error('User already exists');
    }
    return await this.prisma.user.create({
      data: {
        username: username,
        telegramUserId: telegramUserId,
      },
    });
  }

  async deleteUser(id: string) {
    return await this.prisma.user.delete({
      where: {
        telegramUserId: id,
      },
    });
  }

  async getLastRecordsByUserId(telegramUserId: string) {
    const [lastAssistant, lastThread] = await Promise.all([
      this.prisma.assistant.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { openaiAssistantId: true },
      }),
      this.prisma.thread.findFirst({
        where: { telegramUserId },
        orderBy: { createdAt: 'desc' },
        select: { openaiThreadId: true },
      }),
    ]);

    return {
      lastAssistantId: lastAssistant?.openaiAssistantId || null,
      lastThreadId: lastThread?.openaiThreadId || null,
    };
  }
}
