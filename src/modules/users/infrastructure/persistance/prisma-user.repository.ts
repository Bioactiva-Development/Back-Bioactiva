import { User } from '@/modules/users/domain/entities/user';
import {
    FindAllParams,
    UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';
import { UserMapper } from '@/modules/users/infrastructure/mappers/user.mapper';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';
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

    async findByCorreos(correos: string[]): Promise<User[]> {
        if (correos.length === 0) {
            return [];
        }
        const records = await this.prismaClient.usuario.findMany({
            where: { correo: { in: correos } },
        });
        return records.map((record) => UserMapper.toDomain(record));
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

    async findAll(params?: FindAllParams): Promise<User[]> {
        const { search, role, estado, page = 1, limit = 10 } = params ?? {};
        const skip = (page - 1) * limit;

        const records = await this.prismaClient.usuario.findMany({
            where: this.buildWhereInput(search, role, estado),
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });

        return records.map((r) => UserMapper.toDomain(r));
    }

    async countAll(
        params?: Omit<FindAllParams, 'page' | 'limit'>,
    ): Promise<number> {
        const { search, role, estado } = params ?? {};

        return this.prismaClient.usuario.count({
            where: this.buildWhereInput(search, role, estado),
        });
    }

    async findEnabled(): Promise<User[]> {
        const records = await this.prismaClient.usuario.findMany({
            where: { estado: UserMapper.mapStateToPrisma(UserState.ACTIVO) },
            orderBy: [{ nombres: 'asc' }, { apellidos: 'asc' }],
        });
        return records.map((r) => UserMapper.toDomain(r));
    }

    async deleteProvisional(id: number): Promise<boolean> {
        try {
            await this.prismaClient.usuario.delete({ where: { id } });
            return true;
        } catch (error) {
            // P2003: alguna otra tabla referencia a este usuario (no debería
            // ocurrir con un provisional, pero si pasa no queremos reventar
            // el revoke con un 500; el caller decide el fallback).
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003'
            ) {
                return false;
            }
            throw error;
        }
    }

    private buildWhereInput(
        search?: string,
        role?: UserRole,
        estado?: UserState,
    ) {
        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { nombres: { contains: search, mode: 'insensitive' } },
                { correo: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role !== undefined) {
            where.rol = UserMapper.mapRoleToPrisma(role);
        }

        if (estado !== undefined) {
            where.estado = UserMapper.mapStateToPrisma(estado);
        }

        return where;
    }
}
