import { User } from '@/modules/users/domain/entities/user';
import { UserState } from '@/modules/users/domain/enums/estado';
import { UserRole } from '@/shared/domain/enums/rol';
import type {
    Role as PrismaRole,
    Usuario as PrismaUsuario,
    UserStatus as PrismaUserStatus,
} from '@prisma/client';

export class UserMapper {
    static mapRole(role: PrismaRole): UserRole {
        switch (role) {
            case 'ADMINISTRADOR':
                return UserRole.ADMINISTRADOR;
            case 'TRABAJADOR':
                return UserRole.TRABAJADOR;
        }
    }

    static mapState(state: PrismaUserStatus): UserState {
        switch (state) {
            case 'PENDIENTE':
                return UserState.PENDIENTE;
            case 'ACTIVO':
                return UserState.ACTIVO;
            case 'SUSPENDIDO':
                return UserState.SUSPENDIDO;
        }
    }

    static mapRoleToPrisma(role: UserRole): PrismaRole {
        switch (role) {
            case UserRole.ADMINISTRADOR:
                return 'ADMINISTRADOR';
            case UserRole.TRABAJADOR:
                return 'TRABAJADOR';
        }
    }

    static toDomain(record: PrismaUsuario): User {
        return new User(
            record.id,
            record.nombres,
            record.apellidos,
            record.correo,
            record.password,
            record.createdAt,
            this.mapRole(record.rol),
            this.mapState(record.estado),
            record.updatedAt,
        );
    }
}
