import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { USER_REPOSITORY } from '@/modules/users/domain/ports/user-repository.port';
import type { UserRepositoryPort } from '@/modules/users/domain/ports/user-repository.port';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user-not-found.exception';
import { UserCannotBeRevokedException } from '@/modules/users/domain/exceptions/user-cannot-be-revoked.exception';
import { ProvisionalUserCannotBeEnabledException } from '@/modules/users/domain/exceptions/provisional-user-cannot-be-enabled.exception';
import { UserState } from '@/modules/users/domain/enums/estado';

export class EnableUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(targetId: number): Promise<void> {
        const user = await this.userRepository.findById(targetId);
        if (!user) {
            throw new UserNotFoundException(
                `Usuario con id ${targetId} no encontrado`,
            );
        }

        if (user.estado === UserState.ACTIVO) {
            throw new UserCannotBeRevokedException(
                'El usuario ya está habilitado',
            );
        }

        // Un usuario provisional quedó suspendido al revocarse/expirar su
        // invitación y nunca completó su registro (no tiene contraseña).
        // Habilitarlo lo dejaría activo sin credenciales: debe re-invitarse.
        if (user.isProvisional()) {
            throw new ProvisionalUserCannotBeEnabledException(
                'El usuario proviene de una invitación cancelada o expirada y no ' +
                    'completó su registro. Debe ser invitado nuevamente para acceder al sistema.',
            );
        }

        user.activate();
        await this.userRepository.save(user);
    }
}
