import { User } from '@/modules/users/domain/entities/user';
import { UserRepositoryPort } from '@/modules/users/domain/ports/user-repository.port';
import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { UserMapper } from '@/modules/users/infrastructure/mappers/user.mapper';
import { UserRole } from '@/shared/domain/enums/rol';
import { PRISMA_SERVICE } from '@/modules/common/prisma/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
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

    private async create(user: User): Promise<User> {
        const record = await this.prismaClient.usuario.create({
            data: UserMapper.toPersistence(user),
        });

        return UserMapper.toDomain(record);
    }
    private async update(user: User): Promise<User> {
        if (user.id === null) {
            throw new Error('User ID cannot be null for update');
        }
        const record = await this.prismaClient.usuario.update({
            where: {
                id: user.id,
            },
            data: UserMapper.toPersistence(user),
        });

        return UserMapper.toDomain(record);
    }

    async save(user: User): Promise<User> {
        if (user.id === null) {
            return this.create(user);
        }

        return this.update(user);
    }

    async count(options: { where: { role: UserRole } }): Promise<number> {
        return this.prismaClient.usuario.count({
            where: {
                rol:
                    options.where.role === UserRole.ADMINISTRADOR
                        ? 'ADMINISTRADOR'
                        : 'TRABAJADOR',
            },
        });
    }
}
