import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { AdminInitializerService } from '@/modules/users/infrastructure/data-init/users-initializer.service';
import { PrismaUserRepository } from '@/modules/users/infrastructure/persistance/prisma-user.repository';
import { USER_REPOSITORY } from '@/modules/users/domain/ports/user-repository.port';

@Module({
    imports: [AuthModule],
    providers: [
        AdminInitializerService,
        PrismaUserRepository,
        {
            provide: USER_REPOSITORY,
            useExisting: PrismaUserRepository,
        },
    ],
})
export class UsersModule {}
