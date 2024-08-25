import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AssistantsService } from './assistants.service';

@Controller('assistants')
export class AssistantsController {
  constructor(private readonly assistantsService: AssistantsService) {}

  @Get(':userId')
  async getAllAssistant(@Param('userId') userId: string) {
    return await this.assistantsService.getAllAssistantForUserId(userId);
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
    const { userId, assistantName, instructions } = data;
    return await this.assistantsService.createAssistant(
      assistantName,
      userId,
      instructions,
    );
  }

  @Delete(':assistantId')
  async deleteAssistant(@Param('assistantId') assistantId: string) {
    return await this.assistantsService.deleteAssistant(assistantId);
  }
}
