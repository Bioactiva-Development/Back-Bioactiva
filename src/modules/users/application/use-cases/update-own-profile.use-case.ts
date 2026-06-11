import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user-not-found.exception';
import { InvalidUserUpdateException } from '@/modules/users/domain/exceptions/invalid-user-update.exception';
import { User } from '@/modules/users/domain/entities/user';

export interface UpdateOwnProfileInput {
    nombres?: string;
    apellidos?: string;
}

export class UpdateOwnProfileUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(userId: number, input: UpdateOwnProfileInput): Promise<User> {
        if (input.nombres === undefined && input.apellidos === undefined) {
            throw new InvalidUserUpdateException(
                'Debe proporcionar al menos un campo para actualizar.',
            );
        }

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UserNotFoundException(
                `Usuario con id ${userId} no encontrado`,
            );
        }

        user.rename(input.nombres, input.apellidos);

        return this.userRepository.save(user);
    }
}
