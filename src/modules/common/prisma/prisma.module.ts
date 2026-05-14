import { Global, Module } from '@nestjs/common';
import { PrismaService, PRISMA_SERVICE } from './prisma.service';

@Global()
@Module({
    providers: [
        PrismaService,
        {
            provide: PRISMA_SERVICE,
            useExisting: PrismaService,
        },
    ],
    exports: [PrismaService, PRISMA_SERVICE],
})
export class PrismaModule {}
