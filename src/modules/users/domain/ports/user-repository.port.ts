import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

export interface FindAllParams {
    search?: string;
    role?: UserRole;
    estado?: UserState;
    page?: number;
    limit?: number;
}

export interface UserRepositoryPort {
    findByCorreo(correo: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    save(user: User): Promise<User>;
    count(options: { where: { role: UserRole } }): Promise<number>;
    findAll(params?: FindAllParams): Promise<User[]>;
    countAll(params?: Omit<FindAllParams, 'page' | 'limit'>): Promise<number>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
