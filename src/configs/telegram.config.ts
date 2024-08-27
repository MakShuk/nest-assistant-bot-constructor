import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/services/prisma.service';
import { Telegraf, Context } from 'telegraf';

@Global()
@Module({})
export class TelegramModule {
  static forRootAsync(): DynamicModule {
    return {
      module: TelegramModule,
      imports: [ConfigModule],
      providers: [
        PrismaService,
        {
          provide: 'TELEGRAM_BOT_INSTANCE',
          useFactory: async (
            configService: ConfigService,
            prismaService: PrismaService,
          ) => {
            const botToken = configService.get<string>('TELEGRAM_BOT_TOKEN');
            if (!botToken) {
              throw new Error(
                'TELEGRAM_BOT_TOKEN is not defined in the environment',
              );
            }
            const bot = new Telegraf(botToken);
            bot.catch((err: any, ctx: Context) => {
              console.error(
                `Oops, encountered an error for ${ctx.updateType}`,
                err,
              );
            });
            bot.launch();

            bot.use(async (ctx: Context, next: () => Promise<void>) => {
              const userId = ctx.from.id;
              const users = await prismaService.user.findMany();

              const isValidUser = users.some(
                (user) => user.telegramUserId === userId.toString(),
              );

              if (!isValidUser) {
                ctx.reply(
                  `Access denied. You are not registered in the system. Contact the administrator to provide this number: ${userId}`,
                );
                return;
              }

              return next();
            });

            return bot;
          },
          inject: [ConfigService, PrismaService],
        },
      ],
      exports: ['TELEGRAM_BOT_INSTANCE'],
    };
  }
}
