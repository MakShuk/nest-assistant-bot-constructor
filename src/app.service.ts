import { Injectable, OnModuleInit } from '@nestjs/common';
import { TelegrafService } from './telegraf/telegraf.service';
import { CommandsService } from './services/commands.service';
import { InitializationService } from './services/Initialization.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly telegraf: TelegrafService,
    private readonly commands: CommandsService,
    private readonly initialization: InitializationService,
  ) {}

  onModuleInit() {
    const fileCommand =
      process.env.FILE_MODE === 'VECTOR'
        ? this.commands.fileMessage
        : this.commands.fileOneAnswer;

    this.initialization.on();
    this.telegraf.createCommand('start', this.commands.start);
    this.telegraf.createCommand('reset', this.commands.reset);
    this.telegraf.createCommand('store', this.commands.store);
    this.telegraf.textMessage(this.commands.streamText);
    this.telegraf.voiceMessage(this.commands.voiceMessage);
    this.telegraf.imageMessage(this.commands.imageMessage);
    this.telegraf.fileMessage(fileCommand);
    this.telegraf.buttonAction(`store`, this.commands.deleteStore);
  }
}
