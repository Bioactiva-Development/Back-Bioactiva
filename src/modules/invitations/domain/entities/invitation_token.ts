import { InvitationAlreadyAcceptedException } from '@/modules/invitations/domain/exceptions/invitation-already-accepted.exception';
import { InvitationExpiredException } from '@/modules/invitations/domain/exceptions/invitation-expired.exception';
import { InvitationRevokedException } from '@/modules/invitations/domain/exceptions/invitation-revoked.exception';
import { UserRole } from '@/shared/domain/enums/rol';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

export class InvitationToken {
    constructor(
        public readonly id: number | null,
        public readonly correo: string,
        public readonly token: string,
        public readonly rol: UserRole,
        public readonly invitador_id: number,
        public estado: TokenStatus = TokenStatus.PENDIENTE,
        public readonly created_at: Date,
        public consumed_at: Date | null,
        public expired_at: Date,
    ) {}
    isExpired(): boolean {
        return (
            this.estado === TokenStatus.EXPIRADO || new Date() > this.expired_at
        );
    }
    isPending(): boolean {
        return this.estado === TokenStatus.PENDIENTE;
    }
    isAccepted(): boolean {
        return this.estado === TokenStatus.CONSUMIDO;
    }
    accept() {
        if (this.isExpired()) {
            throw new InvitationExpiredException('Token has expired');
        }
        if (!this.isPending()) {
            throw new InvitationAlreadyAcceptedException(
                'Token has already been accepted',
            );
        }
        this.estado = TokenStatus.CONSUMIDO;
        this.consumed_at = new Date();
    }
    revoke() {
        if (this.isExpired()) {
            throw new InvitationExpiredException('Token has expired');
        }
        if (!this.isPending()) {
            throw new InvitationRevokedException('Token has been revoked');
        }
        this.estado = TokenStatus.EXPIRADO;
    }
    expire() {
        if (this.isExpired()) {
            throw new InvitationExpiredException('Token has already expired');
        }
        this.estado = TokenStatus.EXPIRADO;
    }
}
