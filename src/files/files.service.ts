import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class FilesService {
  constructor(@Inject('OPENAI_INSTANCE') private readonly openai: OpenAI) {}

  async getAllFile() {
    const files = await this.openai.files.list();
    console.log(files);
  }
}
