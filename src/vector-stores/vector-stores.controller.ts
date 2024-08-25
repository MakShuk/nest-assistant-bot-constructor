import { Controller, Get } from '@nestjs/common';
import { VectorStoresService } from './vector-stores.service';

@Controller('vector-stores')
export class VectorStoresController {
  constructor(private readonly vectorStoresService: VectorStoresService) {}

  @Get()
  async getAllVectorStore() {
    return await this.vectorStoresService.getAllVectorStores();
  }
}
