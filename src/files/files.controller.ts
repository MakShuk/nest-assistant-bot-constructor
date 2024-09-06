import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly fileService: FilesService) {}

  @Get(`:userId`)
  getAllFiles(@Param('userId') userId: string) {
    return this.fileService.getAllUserFiles(userId);
  }

  @Post()
  createImageFiles(
    @Body()
    data: {
      threadId: string;
      path: string;
    },
  ) {
    return this.fileService.createImageFile(data.threadId, data.path);
  }
}
