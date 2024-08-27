import { Module } from '@nestjs/common';
import { TelegrafService } from './telegraf.service';

@Module({
  providers: [TelegrafService],
})
export class TelegrafModule {}
