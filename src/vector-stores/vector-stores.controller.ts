import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { VectorStoresService } from './vector-stores.service';

@Controller('vector-stores')
export class VectorStoresController {
  constructor(private readonly vectorStoresService: VectorStoresService) {}

  @Get()
  async getAllVectorStore() {
    return await this.vectorStoresService.getAllVectorStores();
  }

  @Post()
  async createVectorStore(
    @Body()
    data: {
      vectorStoreName: string;
      userId: string;
      filePath: string[];
    },
  ) {
    const { userId, vectorStoreName, filePath } = data;
    return await this.vectorStoresService.createVectorStore(
      vectorStoreName,
      userId,
      filePath,
    );
  }

  @Get(':userId')
  async getAllUserVectorStores(@Param('userId') userId: string) {
    return await this.vectorStoresService.getAllUserVectorStores(userId);
  }

  @Delete(':vectorStoreId')
  async deleteVectorStore(@Param('vectorStoreId') vectorStoreId: string) {
    return await this.vectorStoresService.deleteVectorStore(vectorStoreId);
  }
}
