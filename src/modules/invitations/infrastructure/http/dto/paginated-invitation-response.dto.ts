import { ApiProperty } from '@nestjs/swagger';
import { InvitationToken } from '@/modules/invitations/domain/entities/invitation_token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { UserRole } from '@/shared/domain/enums/rol';

class InvitationResponseDto {
    @ApiProperty({ example: 1 })
    id: number | null;

    @ApiProperty({ example: 'user@bioactiva.com' })
    correo: string;

    @ApiProperty({ enum: UserRole })
    rol: UserRole;

    @ApiProperty({ enum: TokenStatus })
    estado: TokenStatus;

    @ApiProperty()
    created_at: Date;

    @ApiProperty({ nullable: true })
    consumed_at: Date | null;

    @ApiProperty()
    expired_at: Date;

    constructor(invitation: InvitationToken) {
        this.id = invitation.id;
        this.correo = invitation.correo;
        this.rol = invitation.rol;
        this.estado = invitation.estado;
        this.created_at = invitation.created_at;
        this.consumed_at = invitation.consumed_at;
        this.expired_at = invitation.expired_at;
    }
}

class PaginationMetaDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 10 })
    limit: number;

    @ApiProperty({ example: 50 })
    total: number;

    @ApiProperty({ example: 5 })
    totalPages: number;
}

export class PaginatedInvitationResponseDto {
    @ApiProperty({ type: [InvitationResponseDto] })
    data: InvitationResponseDto[];

    @ApiProperty({ type: PaginationMetaDto })
    meta: PaginationMetaDto;

    constructor(
        data: InvitationToken[],
        total: number,
        page: number,
        limit: number,
    ) {
        this.data = data.map((i) => new InvitationResponseDto(i));
        this.meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }
}
