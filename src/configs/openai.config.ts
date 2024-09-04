import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';

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
            const proxy = configService.get<string>('PROXY');
            const agent = proxy ? new HttpsProxyAgent(proxy) : null;

            if (!apiKey) {
              throw new Error('OPEN_AI_KEY is not defined in the environment');
            }
            return new OpenAI({ apiKey, httpAgent: agent });
          },
          inject: [ConfigService],
        },
      ],
      exports: ['OPENAI_INSTANCE'],
    };
  }
}
