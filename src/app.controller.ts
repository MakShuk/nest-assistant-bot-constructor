import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post(`init`)
  async init(
    @Body()
    data: {
      userId: string;
      assistantName: string;
      instructions: string;
    },
  ) {
    const { userId, assistantName, instructions } = data;
    return await this.appService.init(userId, assistantName, instructions);
  }

  @Get(`:userId`)
  async stream(@Param('userId') userId: string) {
    return await this.appService.stream(userId);
  }

  @Post(`:userId/:message`)
  async message() {
    return await this.appService.sendMessage();
  }
}
