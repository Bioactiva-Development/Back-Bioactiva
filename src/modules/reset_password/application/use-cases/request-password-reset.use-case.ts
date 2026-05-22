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
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import { HashServicePort } from '@/shared/domain/ports/hash-service.port';
import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

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
    ) {}

    async execute(correo: string): Promise<{ ok: boolean }> {
        const user = await this.userRepository.findByCorreo(correo);
        if (!user || user.id === null) {
            // Retorno silencioso por seguridad (previene la enumeración de usuarios)
            return { ok: true };
        }

        // Generar un token aleatorio seguro
        const rawToken = randomUUID();
        const tokenHash = this.hashService.hash(rawToken);

        // Crear y guardar el token (expiración en 2 horas)
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const resetToken = new PasswordResetToken(
            null,
            user.id,
            tokenHash,
            TokenStatus.PENDIENTE,
            new Date(),
            null,
            expiresAt,
        );

        await this.passwordResetRepository.save(resetToken);

        // Enviar la notificación por correo electrónico de forma asíncrona a través de la cola
        await this.passwordResetNotification.sendResetPasswordEmail(
            correo,
            rawToken,
        );

        return { ok: true };
    }
}
