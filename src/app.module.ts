import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { OpenAIModule } from './configs/openai.config';
import { ThreadsModule } from './threads/threads.module';
import { AssistantsModule } from './assistants/assistants.module';
import { VectorStoresModule } from './vector-stores/vector-stores.module';
import { UsersModule } from './users/users.module';
import { TelegramModule } from './configs/telegram.config';
import { TelegrafModule } from './telegraf/telegraf.module';
import { TelegrafService } from './telegraf/telegraf.service';
import { CommandsService } from './services/commands.service';
import { AssistantsService } from './assistants/assistants.service';
import { PrismaService } from './services/prisma.service';
import { OggConverter } from './services/ogg-converter.service';
import { VectorStoresService } from './vector-stores/vector-stores.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    OpenAIModule.forRootAsync(),
    TelegramModule.forRootAsync(),
    ThreadsModule,
    AssistantsModule,
    VectorStoresModule,
    UsersModule,
    TelegrafModule,
  ],
  controllers: [],
  providers: [
    TelegrafService,
    CommandsService,
    AppService,
    AssistantsService,
    TelegrafService,
    PrismaService,
    OggConverter,
    VectorStoresService,
  ],
})
export class AppModule {}
