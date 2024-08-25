import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from './files/files.module';
import { OpenAIModule } from './configs/openai.config';
import { ThreadsModule } from './threads/threads.module';
import { AssistantsModule } from './assistants/assistants.module';
import { VectorStoresModule } from './vector-stores/vector-stores.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    OpenAIModule.forRootAsync(),
    FilesModule,
    ThreadsModule,
    AssistantsModule,
    VectorStoresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
