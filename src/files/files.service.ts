import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from 'src/services/prisma.service';
import * as fs from 'fs';

@Injectable()
export class FilesService {
  constructor(
    @Inject('OPENAI_INSTANCE') private readonly openai: OpenAI,
    private readonly prisma: PrismaService,
  ) {}

  async getAllUserFiles(userId: string) {
    const userThreads = await this.prisma.thread.findMany({
      where: {
        telegramUserId: userId,
      },
      include: {
        files: true,
      },
    });

    const openaiFileIds = userThreads.flatMap((thread) =>
      thread.files.map((file) => file.openaiFileId),
    );

    return openaiFileIds;
  }

  async createImageFile(threadId: string, imagePath: string) {
    const file = await this.openai.files.create({
      file: fs.createReadStream(imagePath),
      purpose: 'vision',
    });

    const localFiles = this.prisma.file.create({
      data: {
        openaiFileId: file.id,
        threadId: threadId,
      },
    });

    return localFiles;
  }
}
