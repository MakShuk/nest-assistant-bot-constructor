import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ThreadsService } from './threads.service';

@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post(`:userId`)
  async getAllThreads(@Param('userId') userId: string) {
    return await this.threadsService.createThread(userId);
  }

  @Get('thread/:threadId')
  async getThreadById(@Param('threadId') threadId: string) {
    return await this.threadsService.getThreadById(threadId);
  }

  @Get(`:userId`)
  async getAllUserThreads(@Param('userId') userId: string) {
    return await this.threadsService.getAllThreadsForUserId(userId);
  }

  @Delete(':threadId')
  async deleteThread(@Param('threadId') threadId: string) {
    return await this.threadsService.deleteThread(threadId);
  }
}
