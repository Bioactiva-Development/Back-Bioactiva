import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { USER_REPOSITORY } from '@/modules/users/domain/ports/user-repository.port';
import type { UserRepositoryPort } from '@/modules/users/domain/ports/user-repository.port';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user-not-found.exception';
import { UserCannotBeRevokedException } from '@/modules/users/domain/exceptions/user-cannot-be-revoked.exception';
import { UserState } from '@/modules/users/domain/enums/estado';

export class DisableUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(targetId: number, requestingUserId: number): Promise<void> {
        if (targetId === requestingUserId) {
            throw new UserCannotBeRevokedException(
                'Un administrador no puede deshabilitar su propia cuenta',
            );
        }

        const user = await this.userRepository.findById(targetId);
        if (!user) {
            throw new UserNotFoundException(
                `Usuario con id ${targetId} no encontrado`,
            );
        }

        if (user.estado === UserState.SUSPENDIDO) {
            throw new UserCannotBeRevokedException(
                'El usuario ya está deshabilitado',
            );
        }

        user.deactivate();
        await this.userRepository.save(user);
    }
}
