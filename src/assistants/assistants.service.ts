import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from 'src/services/prisma.service';

@Injectable()
export class AssistantsService {
  constructor(
    @Inject('OPENAI_INSTANCE') private readonly openai: OpenAI,
    private readonly prisma: PrismaService,
  ) {}

  async getAllAssistants() {
    const assistants = await this.prisma.assistant.findMany();
    return assistants;
  }

  async getAssistantById(assistantId: string) {
    return await this.openai.beta.assistants.retrieve(assistantId);
  }

  async createAssistant(
    assistantName: string,
    instructions: string,
    assistantId?: string,
  ) {
    let createdAssistantId = assistantId;
    if (!assistantId) {
      const assistant = await this.openai.beta.assistants.create({
        name: `${process.env.PROJECT_NAME}-${assistantName}_TG_BOT`,
        instructions: instructions,
        tools: [{ type: 'file_search' }],
        model: process.env.OPEN_AI_MODEL,
      });
      createdAssistantId = assistant.id;
    }

    return this.prisma.assistant.create({
      data: {
        openaiAssistantId: createdAssistantId,
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

  async getLastAssistant() {
    return await this.prisma.assistant.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }

  async addVectorStoreToAssistant(vectorStoreId: string, assistantId: string) {
    await this.openai.beta.assistants.update(assistantId, {
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStoreId],
        },
      },
    });

    await this.prisma.vectorStore.update({
      where: { openaiVectorStoreId: vectorStoreId },
      data: {
        openaiAssistantId: assistantId,
      },
    });
    return `Vector store ${vectorStoreId} added to assistant ${assistantId}`;
  }
}
