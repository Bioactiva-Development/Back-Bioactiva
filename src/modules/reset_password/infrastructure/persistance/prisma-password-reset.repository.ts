import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { PasswordResetRepositoryPort } from '@/modules/reset_password/domain/ports/password-reset-repository.port';
import { Injectable } from '@shared/infrastructure/dependency-inyection/inyectable';
import { TokenPurpose as PrismaTokenPurpose } from '@prisma/client';
import { PasswordResetMapper } from '@/modules/reset_password/infrastructure/mapper/password-reset.mapper';
import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';
import { TokenMapper } from '@/shared/infrastructure/mapper/token.mapper';

@Injectable()
export class PrismaPasswordResetRepository implements PasswordResetRepositoryPort {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: number): Promise<PasswordResetToken | null> {
        const record = await this.prisma.userToken.findUnique({
            where: { id },
        });
        if (!record || record.proposito !== PrismaTokenPurpose.RESET_PASSWORD) {
            return null;
        }
        return record ? PasswordResetMapper.toDomain(record) : null;
    }

    async findByToken(token: string): Promise<PasswordResetToken | null> {
        const record = await this.prisma.userToken.findFirst({
            where: {
                tokenHash: token,
                proposito: PrismaTokenPurpose.RESET_PASSWORD,
            },
        });
        return record ? PasswordResetMapper.toDomain(record) : null;
    }

    async findPendingByEmail(
        correo: string,
    ): Promise<PasswordResetToken | null> {
        const record = await this.prisma.userToken.findFirst({
            where: {
                correo,
                estado: 'PENDIENTE',
                proposito: PrismaTokenPurpose.RESET_PASSWORD,
            },
        });
        return record ? PasswordResetMapper.toDomain(record) : null;
    }

    async save(resetToken: PasswordResetToken): Promise<PasswordResetToken> {
        const user = await this.prisma.usuario.findUnique({
            where: { id: resetToken.user_id },
            select: { correo: true },
        });

        if (!user) {
            throw new Error(
                'Usuario asociado no encontrado en la base de datos',
            );
        }

        const data = PasswordResetMapper.toPersistence(resetToken);
        data.correo = user.correo;

        const record = await this.prisma.userToken.upsert({
            where: {
                tokenHash: resetToken.token,
            },
            create: data,
            update: {
                estado: TokenMapper.mapTokenStatusToPrisma(resetToken.estado),
                consumedAt: resetToken.consumed_at,
                expiresAt: resetToken.expired_at,
            },
        });

        return PasswordResetMapper.toDomain(record);
    }
}
