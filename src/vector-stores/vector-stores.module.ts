import { Module } from '@nestjs/common';
import { VectorStoresService } from './vector-stores.service';
import { VectorStoresController } from './vector-stores.controller';

@Module({
  controllers: [VectorStoresController],
  providers: [VectorStoresService],
})
export class VectorStoresModule {}
