import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { AdminInitializerService } from '@/modules/users/infrastructure/data-init/users-initializer.service';
import { PrismaUserRepository } from '@/modules/users/infrastructure/persistance/prisma-user.repository';
import { USER_REPOSITORY } from '@/modules/users/domain/ports/user-repository.port';
import { GetAllUsersUseCase } from '@/modules/users/application/use-cases/get-all-users.use-case';
import { DisableUserUseCase } from '@/modules/users/application/use-cases/disable-user.use-case';
import { EnableUserUseCase } from '@/modules/users/application/use-cases/enable-user.use-case';
import { UserController } from '@/modules/users/infrastructure/http/user.controller';

@Module({
    imports: [AuthModule],
    controllers: [UserController],
    providers: [
        AdminInitializerService,
        PrismaUserRepository,
        {
            provide: USER_REPOSITORY,
            useExisting: PrismaUserRepository,
        },
        GetAllUsersUseCase,
        DisableUserUseCase,
        EnableUserUseCase,
    ],
    exports: [USER_REPOSITORY],
})
export class UsersModule {}
