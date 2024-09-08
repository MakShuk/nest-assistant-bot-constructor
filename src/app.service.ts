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
    const fileMode =
      process.env.FILE_MODE === 'VECTOR'
        ? this.commands.fileMessage
        : this.commands.fileOneAnswer;

    const fileCommand = process.env.FILE_ON ? fileMode : this.commands.disable;

    const imageCommand = process.env.IMAGE_ON
      ? this.commands.imageMessage
      : this.commands.disable;

    const voiceCommand = process.env.VOICE_ON
      ? this.commands.voiceMessage
      : this.commands.disable;

    const textCommand = process.env.TEXT_ON
      ? this.commands.streamText
      : this.commands.disable;

    const resetCommand = process.env.RESET_ON
      ? this.commands.notResetContext
      : this.commands.resetContext;

    this.initialization.on();
    this.telegraf.createCommand('start', this.commands.start);
    this.telegraf.createCommand('reset', resetCommand);
    this.telegraf.createCommand('store', this.commands.store);
    this.telegraf.createCommand('info', this.commands.info);
    this.telegraf.textMessage(textCommand);
    this.telegraf.voiceMessage(voiceCommand);
    this.telegraf.imageMessage(imageCommand);
    this.telegraf.fileMessage(fileCommand);
    this.telegraf.buttonAction(`store`, this.commands.deleteStore);
  }
}
