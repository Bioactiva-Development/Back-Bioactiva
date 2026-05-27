import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient, Usuario as PrismaUsuario } from '@prisma/client';
import { AuthUserRepositoryPort } from '@/modules/auth/domain/ports/user-auth-repository.port';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';
import { UserMapper } from '@/modules/users/infrastructure/mappers/user.mapper';
import { PRISMA_SERVICE } from '@/modules/common/prisma/prisma.service';

@Injectable()
export class PrismaUserAuthRepository implements AuthUserRepositoryPort {
    constructor(
        @Inject(PRISMA_SERVICE)
        private readonly prismaClient: PrismaClient,
    ) {}

    async findByCorreo(correo: string): Promise<User | null> {
        const record = await this.prismaClient.usuario.findUnique({
            where: { correo },
        });

        if (!record) {
            return null;
        }

        return UserMapper.toDomain(record);
    }

    async findById(id: number): Promise<User | null> {
        const record = await this.prismaClient.usuario.findUnique({
            where: { id },
        });

        if (!record) {
            return null;
        }

        return UserMapper.toDomain(record);
    }

    async save(user: User): Promise<User> {
        if (user.id === null) {
            throw new Error('User ID cannot be null when saving');
        }
        const record: PrismaUsuario = await this.prismaClient.usuario.update({
            where: { id: user.id },
            data: {
                nombres: user.nombres,
                apellidos: user.apellidos,
                correo: user.correo,
                password: user.password,
                rol:
                    user.role === UserRole.ADMINISTRADOR
                        ? 'ADMINISTRADOR'
                        : 'TRABAJADOR',
                estado: this.mapEstadoToString(user.estado),
            },
        });

        return UserMapper.toDomain(record);
    }

    private mapEstadoToString(estado: UserState): string {
        if (estado === UserState.PENDIENTE) return 'PENDIENTE';
        if (estado === UserState.ACTIVO) return 'ACTIVO';
        return 'SUSPENDIDO';
    }
}
