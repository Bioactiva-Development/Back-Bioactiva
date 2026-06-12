import { randomUUID } from 'node:crypto';
import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    PASSWORD_RESET_REPOSITORY,
    type PasswordResetRepositoryPort,
} from '@/modules/reset_password/domain/ports/password-reset-repository.port';
import {
    PASSWORD_RESET_NOTIFICATION,
    type PasswordResetNotificationPort,
} from '@/modules/reset_password/domain/ports/password-reset-notification.port';
import {
    PASSWORD_RESET_EXPIRATION_SCHEDULER_PORT,
    type PasswordResetExpirationSchedulerPort,
} from '@/modules/reset_password/domain/ports/password-reset-expiration-scheduler.port';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import { HashServicePort } from '@/shared/domain/ports/hash-service.port';
import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { ActiveResetTokenException } from '@/modules/reset_password/domain/exeptions/active-reset-token.exception';
import { AllowedEmailDomainsConfig } from '@/shared/infrastructure/config/allowed-email-domains.config';

const RESET_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const RATE_LIMIT_MS = 5 * 60 * 1000;

export class RequestPasswordResetUseCase {
    constructor(
        @Inject(PASSWORD_RESET_REPOSITORY)
        private readonly passwordResetRepository: PasswordResetRepositoryPort,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        @Inject(PASSWORD_RESET_NOTIFICATION)
        private readonly passwordResetNotification: PasswordResetNotificationPort,
        @Inject(HashServicePort)
        private readonly hashService: HashServicePort,
        @Inject(PASSWORD_RESET_EXPIRATION_SCHEDULER_PORT)
        private readonly expirationScheduler: PasswordResetExpirationSchedulerPort,
        private readonly allowedEmailDomainsConfig: AllowedEmailDomainsConfig,
    ) {}

    async execute(correo: string): Promise<{ ok: boolean }> {
        const domain = correo.split('@')[1]?.toLowerCase();
        const allowedDomains =
            this.allowedEmailDomainsConfig.getAllowedDomains();
        if (
            allowedDomains.length > 0 &&
            (!domain || !allowedDomains.includes(domain))
        ) {
            return { ok: true };
        }

        const user = await this.userRepository.findByCorreo(correo);
        if (user?.id == null || !user.canAuthenticate()) {
            return { ok: true };
        }

        const existingToken =
            await this.passwordResetRepository.findPendingByEmail(correo);
        if (existingToken) {
            const rateLimitCutoff = new Date(Date.now() - RATE_LIMIT_MS);
            if (existingToken.created_at > rateLimitCutoff) {
                throw new ActiveResetTokenException();
            }
            existingToken.expire();
            await this.passwordResetRepository.save(existingToken);
        }

        const rawToken = randomUUID();
        const tokenHash = this.hashService.hash(rawToken);

        const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
        const resetToken = new PasswordResetToken(
            null,
            user.id,
            tokenHash,
            TokenStatus.PENDIENTE,
            new Date(),
            null,
            expiresAt,
        );

        const savedToken = await this.passwordResetRepository.save(resetToken);

        await this.expirationScheduler.scheduleExpiration({
            resetTokenId: savedToken.id!,
            expiresAt: savedToken.expired_at,
        });

        await this.passwordResetNotification.sendResetPasswordEmail(
            correo,
            rawToken,
        );

        return { ok: true };
    }
}
