import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/enums/rol';

export interface UserRepositoryPort {
    findByCorreo(correo: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    save(user: User): Promise<User>;
    count(options: { where: { role: UserRole } }): Promise<number>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
