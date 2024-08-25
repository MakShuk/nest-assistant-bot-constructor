import { Module } from '@nestjs/common';
import { VectorStoresService } from './vector-stores.service';
import { VectorStoresController } from './vector-stores.controller';
import { PrismaService } from 'src/services/prisma.service';

@Module({
  controllers: [VectorStoresController],
  providers: [VectorStoresService, PrismaService],
})
export class VectorStoresModule {}
