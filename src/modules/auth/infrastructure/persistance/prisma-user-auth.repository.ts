import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient, Usuario as PrismaUsuario } from '@prisma/client';
import { AuthUserRepositoryPort } from '@/modules/auth/domain/ports/user-auth-repository.port';
import { User } from '@/modules/users/domain/entities/user';
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
            data: UserMapper.toPersistence(user),
        });

        return UserMapper.toDomain(record);
    }

    async incrementTokenVersion(userId: number): Promise<number> {
        const record = await this.prismaClient.usuario.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } },
            select: { tokenVersion: true },
        });

        return record.tokenVersion;
    }
}
