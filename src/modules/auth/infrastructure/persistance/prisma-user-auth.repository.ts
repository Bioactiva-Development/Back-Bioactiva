import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient, Usuario as PrismaUsuario } from '@prisma/client';
import { AuthUserRepositoryPort } from '@/modules/auth/domain/ports/user-auth-repository.port';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';
import { UserMapper } from '@/modules/users/infrastructure/mappers/user.mapper';

@Injectable()
export class PrismaUserAuthRepository implements AuthUserRepositoryPort {
    constructor(
        @Inject('PRISMA_SERVICE')
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
                estado:
                    user.estado === UserState.PENDIENTE
                        ? 'PENDIENTE'
                        : user.estado === UserState.ACTIVO
                          ? 'ACTIVO'
                          : 'SUSPENDIDO',
            },
        });

        return UserMapper.toDomain(record);
    }
}
