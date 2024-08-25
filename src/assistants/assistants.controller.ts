import { Controller, Get } from '@nestjs/common';
import { AssistantsService } from './assistants.service';

@Controller('assistants')
export class AssistantsController {
  constructor(private readonly assistantsService: AssistantsService) {}
  @Get()
  async getAllAssistant() {
    return await this.assistantsService.getAllAssistant();
  }
}
