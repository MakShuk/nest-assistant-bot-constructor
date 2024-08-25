import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class VectorStoresService {
  constructor(@Inject('OPENAI_INSTANCE') private readonly openai: OpenAI) {}

  getAllVectorStores() {
    return this.openai.beta.vectorStores.list();
  }
}
