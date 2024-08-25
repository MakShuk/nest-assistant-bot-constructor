import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }
  @Get(':userId')
  async getUserById(@Param('userId') userId: string) {
    return await this.usersService.getUserById(userId);
  }

  @Post()
  async createUser(
    @Body()
    { username, telegramUserId }: { username: string; telegramUserId: string },
  ) {
    return await this.usersService.createUser(username, telegramUserId);
  }

  @Delete(':userId')
  async deleteUser(@Param('userId') userId: string) {
    return this.usersService.deleteUser(userId);
  }
}
