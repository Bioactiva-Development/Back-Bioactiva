import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { InvitationsRepositoryPort } from '@/modules/invitations/domain/port/invitations-repository.port';
import { Injectable } from '@nestjs/common';
import {
    TokenPurpose as PrismaTokenPurpose,
    TokenStatus as PrismaTokenStatus,
} from '@prisma/client';
import { InvitationMapper } from '@/modules/invitations/infrastructure/mapper/invitation.mapper';
import { InvitationToken } from '@/modules/invitations/domain/entities/invitation_token';
import { TokenMapper } from '@/shared/infrastructure/mapper/token.mapper';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

@Injectable()
export class PrismaInvitationsRepository implements InvitationsRepositoryPort {
    constructor(private readonly prisma: PrismaService) {}

    async list(
        page?: number,
        limit?: number,
        term?: string,
        estado?: TokenStatus,
    ): Promise<InvitationToken[]> {
        const where = this.buildWhere(term, estado);
        page = page ?? 1;
        limit = limit ?? 10;
        const tokens = await this.prisma.userToken.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
        return tokens.map((token) => InvitationMapper.toDomain(token));
    }

    async count(term?: string, estado?: TokenStatus): Promise<number> {
        return this.prisma.userToken.count({ where: this.buildWhere(term, estado) });
    }

    private buildWhere(term?: string, estado?: TokenStatus) {
        return {
            proposito: PrismaTokenPurpose.INVITACION,
            correo: { contains: term },
            estado: estado
                ? TokenMapper.mapTokenStatusToPrisma(estado)
                : undefined,
        };
    }

    async findPendingExpired(before: Date): Promise<InvitationToken[]> {
        const tokens = await this.prisma.userToken.findMany({
            where: {
                proposito: PrismaTokenPurpose.INVITACION,
                estado: PrismaTokenStatus.PENDIENTE,
                expiresAt: {
                    lte: before,
                },
            },
            orderBy: { expiresAt: 'asc' },
        });

        return tokens.map((token) => InvitationMapper.toDomain(token));
    }

    async findById(id: number): Promise<InvitationToken | null> {
        const token = await this.prisma.userToken.findUnique({
            where: { id },
        });
        return token ? InvitationMapper.toDomain(token) : null;
    }

    async findByToken(token: string): Promise<InvitationToken | null> {
        const record = await this.prisma.userToken.findFirst({
            where: {
                tokenHash: token,
                proposito: PrismaTokenPurpose.INVITACION,
            },
        });
        return record ? InvitationMapper.toDomain(record) : null;
    }

    async findPendingByEmail(correo: string): Promise<InvitationToken | null> {
        const token = await this.prisma.userToken.findFirst({
            where: {
                correo,
                estado: PrismaTokenStatus.PENDIENTE,
                proposito: PrismaTokenPurpose.INVITACION,
            },
        });

        return token ? InvitationMapper.toDomain(token) : null;
    }

    async save(invitation: InvitationToken): Promise<InvitationToken> {
        const record = await this.prisma.userToken.upsert({
            where: {
                tokenHash: invitation.token,
                proposito: PrismaTokenPurpose.INVITACION,
            },
            create: InvitationMapper.toPersistence(invitation),
            update: {
                estado: TokenMapper.mapTokenStatusToPrisma(invitation.estado),
                consumedAt: invitation.consumed_at,
                expiresAt: invitation.expired_at,
            },
        });

        return InvitationMapper.toDomain(record);
    }

    async expireAllPending(ids: number[]): Promise<number> {
        if (ids.length === 0) {
            return 0;
        }
        const result = await this.prisma.userToken.updateMany({
            where: {
                id: { in: ids },
                proposito: PrismaTokenPurpose.INVITACION,
                estado: PrismaTokenStatus.PENDIENTE,
            },
            data: { estado: PrismaTokenStatus.EXPIRADO },
        });
        return result.count;
    }
}
