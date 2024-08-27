import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { OpenAIModule } from './configs/openai.config';
import { ThreadsModule } from './threads/threads.module';
import { AssistantsModule } from './assistants/assistants.module';
import { VectorStoresModule } from './vector-stores/vector-stores.module';
import { UsersModule } from './users/users.module';
import { UsersService } from './users/users.service';
import { ThreadsService } from './threads/threads.service';
import { AssistantsService } from './assistants/assistants.service';
import { PrismaService } from './services/prisma.service';
import { TelegramModule } from './configs/telegram.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    OpenAIModule.forRootAsync(),
    TelegramModule.forRootAsync(),
    ThreadsModule,
    AssistantsModule,
    VectorStoresModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    UsersService,
    ThreadsService,
    AssistantsService,
    PrismaService,
  ],
})
export class AppModule {}
