import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { PrismaModule } from '@/modules/common/prisma/prisma.module';
import { UsersModule } from '@/modules/users/user.module';
import { RequestPasswordResetUseCase } from '@/modules/reset_password/application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '@/modules/reset_password/application/use-cases/reset-password.use-case';
import { PASSWORD_RESET_REPOSITORY } from '@/modules/reset_password/domain/ports/password-reset-repository.port';
import { PASSWORD_RESET_NOTIFICATION } from '@/modules/reset_password/domain/ports/password-reset-notification.port';
import { PrismaPasswordResetRepository } from '@/modules/reset_password/infrastructure/persistance/prisma-password-reset.repository';
import { PasswordResetEmailPublisher } from '@/modules/reset_password/infrastructure/queue/password-reset-email.publisher';
import { ResetPasswordQueueModule } from '@/modules/reset_password/infrastructure/queue/reset-password-queue.module';
import { ResetPasswordController } from '@/modules/reset_password/infrastructure/http/reset-password.controller';
import { HashServicePort } from '@/shared/domain/ports/hash-service.port';
import { Sha256HashService } from '@/shared/infrastructure/service/sha256-hash.service';

@Module({
    imports: [
        AuthModule,
        UsersModule,
        PrismaModule,
        forwardRef(() => ResetPasswordQueueModule),
    ],
    controllers: [ResetPasswordController],
    providers: [
        RequestPasswordResetUseCase,
        ResetPasswordUseCase,
        PrismaPasswordResetRepository,
        Sha256HashService,
        {
            provide: PASSWORD_RESET_REPOSITORY,
            useExisting: PrismaPasswordResetRepository,
        },
        {
            provide: PASSWORD_RESET_NOTIFICATION,
            useExisting: PasswordResetEmailPublisher,
        },
        {
            provide: HashServicePort,
            useExisting: Sha256HashService,
        },
    ],
    exports: [RequestPasswordResetUseCase, ResetPasswordUseCase],
})
export class ResetPasswordModule {}
