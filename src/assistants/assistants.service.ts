import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AssistantsService {
  constructor(@Inject('OPENAI_INSTANCE') private readonly openai: OpenAI) {}
  async getAllAssistant() {
    const { data } = await this.openai.beta.assistants.list();
    return data;
  }
}
