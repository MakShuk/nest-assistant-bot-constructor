import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AssistantsService } from './assistants.service';

@Controller('assistants')
export class AssistantsController {
  constructor(private readonly assistantsService: AssistantsService) {}

  @Get()
  async getAllAssistant() {
    return await this.assistantsService.getAllAssistants();
  }

  @Get('assistant/:assistantId')
  async getAssistantById(@Param('assistantId') assistantId: string) {
    return await this.assistantsService.getAssistantById(assistantId);
  }

  @Post()
  async createAssistant(
    @Body()
    data: {
      assistantName: string;
      userId: string;
      instructions: string;
    },
  ) {
    const { assistantName, instructions } = data;
    return await this.assistantsService.createAssistant(
      assistantName,
      instructions,
    );
  }

  @Delete(':assistantId')
  async deleteAssistant(@Param('assistantId') assistantId: string) {
    return await this.assistantsService.deleteAssistant(assistantId);
  }

  @Patch()
  async addVectorStoreToAssistant(
    @Body()
    data: {
      vectorStoreId: string;
      assistantId: string;
    },
  ) {
    return await this.assistantsService.addVectorStoreToAssistant(
      data.vectorStoreId,
      data.assistantId,
    );
  }
}
