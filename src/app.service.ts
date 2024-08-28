import { Injectable, OnModuleInit } from '@nestjs/common';
import { TelegrafService } from './telegraf/telegraf.service';
import { CommandsService } from './services/commands.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly telegraf: TelegrafService,
    private readonly commands: CommandsService,
  ) {}

  onModuleInit() {
    this.telegraf.createCommand('start', this.commands.start);
    this.telegraf.createCommand('reset', this.commands.reset);
    this.telegraf.createCommand('store', this.commands.store);
    this.telegraf.textMessage(this.commands.streamText);
    this.telegraf.voiceMessage(this.commands.voiceMessage);
    this.telegraf.imageMessage(this.commands.imageMessage);
    this.telegraf.fileMessage(this.commands.fileMessage);

    this.telegraf.buttonAction(`store`, this.commands.deleteStore);
  }
}
