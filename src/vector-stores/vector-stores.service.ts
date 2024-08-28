import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
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

  async getOpenaiVectorStoreById(vectorStoreId: string) {
    return await this.openai.beta.vectorStores.files.list(vectorStoreId);
  }

  async createVectorStore(filePath: string[]) {
    const fileStreams = filePath.map((fileName) =>
      fs.createReadStream(fileName),
    );

    const vectorStore = await this.openai.beta.vectorStores.create({
      name: `${process.env.PROJECT_NAME}_TG_BOT`,
    });

    const vectorStoresStatus =
      await this.openai.beta.vectorStores.fileBatches.uploadAndPoll(
        vectorStore.id,
        {
          files: fileStreams,
        },
      );

    await this.prisma.vectorStore.create({
      data: {
        openaiVectorStoreId: vectorStoresStatus.vector_store_id,
      },
    });
    return vectorStore.id;
  }

  async deleteVectorStore(vectorStoreId: string) {
    const storeFiles =
      await this.openai.beta.vectorStores.files.list(vectorStoreId);

    storeFiles.data.forEach(async (file) => {
      await this.openai.files.del(file.id);
    });

    const vectorStoreAi =
      await this.openai.beta.vectorStores.del(vectorStoreId);

    const vectorStoreDB = await this.prisma.vectorStore.delete({
      where: {
        openaiVectorStoreId: vectorStoreId,
      },
    });

    return `Vector store ${vectorStoreAi.id} deleted from OpenAI and ${vectorStoreDB.openaiVectorStoreId} deleted from DB`;
  }

  async getLastVectorStore() {
    return await this.prisma.vectorStore.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFileToVectorStore(vectorStoreId: string, filePath: string) {
    const updateStore = await this.openai.beta.vectorStores.files.upload(
      vectorStoreId,
      fs.createReadStream(filePath),
    );
    return updateStore;
  }
}
