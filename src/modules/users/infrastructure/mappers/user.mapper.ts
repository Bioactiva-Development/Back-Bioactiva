import { User } from '@/modules/users/domain/entities/user';
import { UserState } from '@/modules/users/domain/enums/estado';
import { UserRole } from '@/shared/domain/enums/rol';
import type {
    Prisma,
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

    static mapStateToPrisma(state: UserState): PrismaUserStatus {
        switch (state) {
            case UserState.PENDIENTE:
                return 'PENDIENTE';
            case UserState.ACTIVO:
                return 'ACTIVO';
            case UserState.SUSPENDIDO:
                return 'SUSPENDIDO';
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

    static toPersistence(user: User): Prisma.UsuarioCreateInput {
        return {
            nombres: user.nombres,
            apellidos: user.apellidos,
            correo: user.correo,
            password: user.password,
            rol: this.mapRoleToPrisma(user.role),
            estado: this.mapStateToPrisma(user.estado),
        };
    }
}
