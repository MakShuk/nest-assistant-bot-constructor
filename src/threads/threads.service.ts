import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class ThreadsService {
  constructor(@Inject('OPENAI_INSTANCE') private readonly openai: OpenAI) {}

  async createThread() {
    const thread = await this.openai.beta.threads.create({
      metadata: {},
    });
    return thread;
  }
}
