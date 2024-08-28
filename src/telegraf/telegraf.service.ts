import { Inject, Injectable } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

@Injectable()
export class TelegrafService {
  constructor(
    @Inject('TELEGRAM_BOT_INSTANCE') private readonly bot: Telegraf<Context>,
  ) {}
  createCommand(command: string, callback: (ctx: Context) => void) {
    this.bot.command(command, callback);
  }

  textMessage(callback: (ctx: Context) => void) {
    this.bot.on(message('text'), callback);
  }

  async voiceMessage(callback: (ctx: Context) => void) {
    this.bot.on(message('voice'), callback);
  }

  imageMessage(callback: (ctx: Context) => void) {
    this.bot.on(message('photo'), callback);
  }

  async fileMessage(callback: (ctx: Context) => void) {
    this.bot.on(message('document'), callback);
  }

  async buttonAction(
    action: string | RegExp,
    callback: (ctx: Context) => void,
  ) {
    this.bot.action(action, callback);
  }
}
