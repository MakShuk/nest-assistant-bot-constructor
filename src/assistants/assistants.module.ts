import { Module } from '@nestjs/common';
import { AssistantsService } from './assistants.service';
import { AssistantsController } from './assistants.controller';
import { PrismaService } from 'src/services/prisma.service';

@Module({
  controllers: [AssistantsController],
  providers: [AssistantsService, PrismaService],
})
export class AssistantsModule {}
