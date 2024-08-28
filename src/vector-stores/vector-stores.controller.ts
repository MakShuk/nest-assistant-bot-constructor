import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
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
    const { filePath } = data;
    return await this.vectorStoresService.createVectorStore(filePath);
  }

  @Delete(':vectorStoreId')
  async deleteVectorStore(@Param('vectorStoreId') vectorStoreId: string) {
    return await this.vectorStoresService.deleteVectorStore(vectorStoreId);
  }

  @Patch()
  async getLastVectorStore(
    @Body()
    data: {
      vectorStoreId: string;
      filePath: string;
    },
  ) {
    return await this.vectorStoresService.addFileToVectorStore(
      data.vectorStoreId,
      data.filePath,
    );
  }
}
