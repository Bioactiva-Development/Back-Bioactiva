import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { AdminInitializerService } from '@/modules/users/infrastructure/data-init/users-initializer.service';
import { PrismaUserRepository } from '@/modules/users/infrastructure/persistance/prisma-user.repository';
import { USER_REPOSITORY } from '@/modules/users/domain/ports/user-repository.port';
import { GetAllUsersUseCase } from '@/modules/users/application/use-cases/get-all-users.use-case';
import { GetAssignableUsersUseCase } from '@/modules/users/application/use-cases/get-assignable-users.use-case';
import { DisableUserUseCase } from '@/modules/users/application/use-cases/disable-user.use-case';
import { EnableUserUseCase } from '@/modules/users/application/use-cases/enable-user.use-case';
import { ChangeUserRoleUseCase } from '@/modules/users/application/use-cases/change-user-role.use-case';
import { UpdateOwnProfileUseCase } from '@/modules/users/application/use-cases/update-own-profile.use-case';
import { ChangeOwnPasswordUseCase } from '@/modules/users/application/use-cases/change-own-password.use-case';
import { UserController } from '@/modules/users/infrastructure/http/user.controller';
import { ProfileController } from '@/modules/users/infrastructure/http/profile.controller';

@Module({
    imports: [AuthModule],
    controllers: [UserController, ProfileController],
    providers: [
        AdminInitializerService,
        PrismaUserRepository,
        {
            provide: USER_REPOSITORY,
            useExisting: PrismaUserRepository,
        },
        GetAllUsersUseCase,
        GetAssignableUsersUseCase,
        DisableUserUseCase,
        EnableUserUseCase,
        ChangeUserRoleUseCase,
        UpdateOwnProfileUseCase,
        ChangeOwnPasswordUseCase,
    ],
    exports: [USER_REPOSITORY, AdminInitializerService],
})
export class UsersModule {}
