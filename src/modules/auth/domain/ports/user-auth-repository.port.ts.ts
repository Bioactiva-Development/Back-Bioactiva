import { User } from '@/modules/users/domain/entities/user';

export interface AuthUserRepositoryPort {
    findByCorreo(correo: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    save(user: User): Promise<User>;
}
