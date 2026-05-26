import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';
import {
    $Enums,
    Prisma,
    UserToken as PrismaUserToken,
    TokenPurpose as PrismaTokenPurpose,
} from '@prisma/client';
import { TokenMapper } from '@/shared/infrastructure/mapper/token.mapper';

export class PasswordResetMapper {
    static toDomain(record: PrismaUserToken): PasswordResetToken {
        if (record.proposito !== PrismaTokenPurpose.RESET_PASSWORD) {
            throw new Error('El token no es de restablecimiento de contraseña');
        }
        if (record.idUsuario === null) {
            throw new Error(
                'El token de restablecimiento debe tener un ID de usuario asociado',
            );
        }
        return new PasswordResetToken(
            record.id,
            record.idUsuario,
            record.tokenHash,
            TokenMapper.mapTokenStatus(record.estado),
            record.createdAt,
            record.consumedAt,
            record.expiresAt,
        );
    }

    static toPersistence(
        resetToken: PasswordResetToken,
    ): Prisma.UserTokenCreateInput {
        return {
            correo: '', // Este correo lo asociaremos en el repositorio
            tokenHash: resetToken.token,
            proposito: $Enums.TokenPurpose.RESET_PASSWORD,
            estado: TokenMapper.mapTokenStatusToPrisma(resetToken.estado),
            expiresAt: resetToken.expired_at,
            consumedAt: resetToken.consumed_at,
            usuario: { connect: { id: resetToken.user_id } },
            createdAt: resetToken.created_at,
        };
    }
}
