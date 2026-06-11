import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import {
    PASSWORD_HASHER,
    type PasswordHasherPort,
} from '@/modules/auth/domain/ports/password-hasher.port';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user-not-found.exception';
import { InvalidCurrentPasswordException } from '@/modules/users/domain/exceptions/invalid-current-password.exception';
import { InvalidUserUpdateException } from '@/modules/users/domain/exceptions/invalid-user-update.exception';

export class ChangeOwnPasswordUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        @Inject(PASSWORD_HASHER)
        private readonly passwordHasher: PasswordHasherPort,
    ) {}

    async execute(
        userId: number,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UserNotFoundException(
                `Usuario con id ${userId} no encontrado`,
            );
        }

        const currentMatches = await this.passwordHasher.compare(
            currentPassword,
            user.password,
        );
        if (!currentMatches) {
            throw new InvalidCurrentPasswordException(
                'La contraseña actual no es correcta.',
            );
        }

        const reusesCurrent = await this.passwordHasher.compare(
            newPassword,
            user.password,
        );
        if (reusesCurrent) {
            throw new InvalidUserUpdateException(
                'La nueva contraseña debe ser distinta de la actual.',
            );
        }

        user.updatePassword(await this.passwordHasher.hash(newPassword));

        await this.userRepository.save(user);
    }
}
