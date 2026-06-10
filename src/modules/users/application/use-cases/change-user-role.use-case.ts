import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user-not-found.exception';
import { CannotChangeOwnRoleException } from '@/modules/users/domain/exceptions/cannot-change-own-role.exception';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';

export class ChangeUserRoleUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(
        targetId: number,
        newRole: UserRole,
        requestingUserId: number,
    ): Promise<User> {
        if (targetId === requestingUserId) {
            throw new CannotChangeOwnRoleException(
                'Un administrador no puede cambiar su propio rol.',
            );
        }

        const user = await this.userRepository.findById(targetId);
        if (!user) {
            throw new UserNotFoundException(
                `Usuario con id ${targetId} no encontrado`,
            );
        }

        if (user.role !== newRole) {
            user.changeRole(newRole);
            // El rol viaja dentro del JWT: invalidamos la sesión vigente para
            // que el nuevo rol surta efecto de inmediato (Mantis #271 + #333).
            user.bumpTokenVersion();
        }

        return this.userRepository.save(user);
    }
}
