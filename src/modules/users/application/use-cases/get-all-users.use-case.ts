import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { USER_REPOSITORY } from '@/modules/users/domain/ports/user-repository.port';
import type { UserRepositoryPort } from '@/modules/users/domain/ports/user-repository.port';
import { User } from '@/modules/users/domain/entities/user';
import { ListUsersDto } from '@/modules/users/application/dto/list-users.dto';

export interface GetAllUsersResult {
    data: User[];
    total: number;
}

export class GetAllUsersUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(dto: ListUsersDto): Promise<GetAllUsersResult> {
        const { search, role, estado, page, limit } = dto;

        const [data, total] = await Promise.all([
            this.userRepository.findAll({ search, role, estado, page, limit }),
            this.userRepository.countAll({ search, role, estado }),
        ]);

        return { data, total };
    }
}
