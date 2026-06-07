import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const redisUrl = new URL(configService.getOrThrow<string>('REDIS_URL'));
                return {
                    connection: {
                        host: redisUrl.hostname,
                        port: Number(redisUrl.port),
                        password: redisUrl.password
                            ? decodeURIComponent(redisUrl.password)
                            : undefined,
                    },
                };
            },
        }),
    ],
    exports: [BullModule],
})
export class RedisModule {}
