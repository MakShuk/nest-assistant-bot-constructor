import { Injectable } from '@nestjs/common';

@Injectable()
export class FileService {
  findAll() {
    return `This action returns all file`;
  }
}
