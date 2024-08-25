import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from 'src/services/prisma.service';

@Injectable()
export class VectorStoresService {
  constructor(
    @Inject('OPENAI_INSTANCE') private readonly openai: OpenAI,
    private readonly prisma: PrismaService,
  ) {}

  async getAllVectorStores() {
    return await this.openai.beta.vectorStores.list();
  }

  async getAllUserVectorStores(userId: string) {
    return await this.prisma.vectorStore.findMany({
      where: {
        telegramUserId: userId,
      },
    });
  }

  async createVectorStore(
    vectorStoreName: string,
    userId: string,
    filePath: string[],
  ) {
    const basePath = path.resolve(__dirname, '..', '../temp/');

    const fileStreams = filePath.map((fileName) =>
      fs.createReadStream(path.join(basePath, fileName)),
    );

    const vectorStore = await this.openai.beta.vectorStores.create({
      name: `${vectorStoreName} - ${userId}-tg-bot`,
    });

    const vectorStoresStatus =
      await this.openai.beta.vectorStores.fileBatches.uploadAndPoll(
        vectorStore.id,
        {
          files: fileStreams,
        },
      );

    const vectorStoresDB = await this.prisma.vectorStore.create({
      data: {
        openaiVectorStoreId: vectorStoresStatus.vector_store_id,
        telegramUserId: userId,
      },
    });
    return `Vector store ${vectorStoresDB.openaiVectorStoreId} created for user ${vectorStoresDB.telegramUserId}`;
  }

  async deleteVectorStore(vectorStoreId: string) {
    const vectorStoreAi =
      await this.openai.beta.vectorStores.del(vectorStoreId);

    const vectorStoreDB = await this.prisma.vectorStore.delete({
      where: {
        openaiVectorStoreId: vectorStoreId,
      },
    });

    return `Vector store ${vectorStoreAi.id} deleted from OpenAI and ${vectorStoreDB.openaiVectorStoreId} deleted from DB`;
  }
}
