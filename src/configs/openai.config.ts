import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Global()
@Module({})
export class OpenAIModule {
  static forRootAsync(): DynamicModule {
    return {
      module: OpenAIModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'OPENAI_INSTANCE',
          useFactory: async (configService: ConfigService) => {
            const apiKey = configService.get<string>('OPEN_AI_KEY');
            if (!apiKey) {
              throw new Error('OPEN_AI_KEY is not defined in the environment');
            }
            return new OpenAI({ apiKey });
          },
          inject: [ConfigService],
        },
      ],
      exports: ['OPENAI_INSTANCE'],
    };
  }
}
