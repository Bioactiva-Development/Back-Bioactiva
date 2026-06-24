import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { USER_REPOSITORY } from '@/modules/users/domain/ports/user-repository.port';
import type { UserRepositoryPort } from '@/modules/users/domain/ports/user-repository.port';
import { User } from '@/modules/users/domain/entities/user';

/**
 * Lista los usuarios habilitados para poblar selectores de asignación (p. ej. el
 * encargado de un lead). A diferencia del listado de gestión (GetAllUsers), no
 * restringe por rol: cualquier usuario autenticado puede asignar a cualquier
 * usuario habilitado (Mantis #434).
 */
export class GetAssignableUsersUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(): Promise<User[]> {
        return this.userRepository.findEnabled();
    }
}
