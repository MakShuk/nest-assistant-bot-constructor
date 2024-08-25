import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AssistantsService {
  constructor(@Inject('OPENAI_INSTANCE') private readonly openai: OpenAI) {}
  getAllAssistant() {
    return this.openai.beta.assistants.list();
  }
}
