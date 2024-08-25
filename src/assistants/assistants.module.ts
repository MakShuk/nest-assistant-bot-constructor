import { Module } from '@nestjs/common';
import { AssistantsService } from './assistants.service';
import { AssistantsController } from './assistants.controller';

@Module({
  controllers: [AssistantsController],
  providers: [AssistantsService],
})
export class AssistantsModule {}
