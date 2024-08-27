import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from 'src/services/prisma.service';

@Injectable()
export class AssistantsService {
  constructor(
    @Inject('OPENAI_INSTANCE') private readonly openai: OpenAI,
    private readonly prisma: PrismaService,
  ) {}

  async getAllAssistantForUserId(userId: string) {
    const assistants = await this.prisma.assistant.findMany({
      where: {
        telegramUserId: userId,
      },
    });
    return assistants;
  }

  async getAssistantById(assistantId: string) {
    return await this.openai.beta.assistants.retrieve(assistantId);
  }

  async createAssistant(
    assistantName: string,
    userId: string,
    instructions: string,
  ) {
    const assistant = await this.openai.beta.assistants.create({
      name: `${assistantName} - ${userId}-tg-bot`,
      instructions: instructions,
      tools: [{ type: 'file_search' }],
      model: process.env.OPENAI_MODEL,
    });
    return this.prisma.assistant.create({
      data: {
        openaiAssistantId: assistant.id,
        telegramUserId: userId,
      },
    });
  }

  async deleteAssistant(assistantId: string) {
    const assistantAi = await this.openai.beta.assistants.del(assistantId);
    const assistantDB = await this.prisma.assistant.delete({
      where: {
        openaiAssistantId: assistantId,
      },
    });

    return `Assistant ${assistantAi.id} deleted from OpenAI and ${assistantDB.openaiAssistantId} deleted from DB`;
  }

  async getLastAssistantByUserId(userId: string) {
    const assistant = await this.prisma.assistant.findFirst({
      where: {
        telegramUserId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return assistant;
  }
}
