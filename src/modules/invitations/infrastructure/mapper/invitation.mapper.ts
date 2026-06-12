import { InvitationToken } from '@/modules/invitations/domain/entities/invitation_token';
import {
    $Enums,
    Prisma,
    UserToken as PrismaUserToken,
    TokenPurpose as PrismaTokenPurpose,
} from '@prisma/client';
import { UserMapper } from '@/modules/users/infrastructure/mappers/user.mapper';
import { TokenMapper } from '@/shared/infrastructure/mapper/token.mapper';

export class InvitationMapper {
    static toDomain(record: PrismaUserToken): InvitationToken {
        if (record.proposito !== PrismaTokenPurpose.INVITACION) {
            throw new Error('El token no es una invitación');
        }
        if (!record.rol) {
            throw new Error(
                'El token de invitación debe tener un rol asociado',
            );
        }
        if (!record.invitadorId) {
            throw new Error(
                'El token de invitación debe tener un ID de invitador asociado',
            );
        }
        return new InvitationToken(
            record.id,
            record.correo,
            record.tokenHash,
            UserMapper.mapRole(record.rol),
            record.invitadorId,
            TokenMapper.mapTokenStatus(record.estado),
            record.createdAt,
            record.consumedAt,
            record.expiresAt,
        );
    }

    static toPersistence(
        invitation: InvitationToken,
    ): Prisma.UserTokenCreateInput {
        return {
            correo: invitation.correo,
            tokenHash: invitation.token,
            proposito: $Enums.TokenPurpose.INVITACION,
            estado: TokenMapper.mapTokenStatusToPrisma(invitation.estado),
            rol: UserMapper.mapRoleToPrisma(invitation.rol),
            expiresAt: invitation.expired_at,
            consumedAt: invitation.consumed_at,
            invitador: { connect: { id: invitation.invitador_id } },
            createdAt: invitation.created_at,
        };
    }
}
