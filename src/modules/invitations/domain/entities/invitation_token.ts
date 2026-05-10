import { UserRole } from '@/shared/enums/rol';
import { TokenStatus } from '@/shared/enums/token_estado';

export class InvitationToken {
    constructor(
        public readonly id: string,
        public readonly correo: string,
        public readonly token: string,
        public readonly rol: UserRole,
        public readonly invitadorId: number,
        public estado: TokenStatus = TokenStatus.PENDIENTE,
        public readonly createdAt: Date,
        public consumedAt: Date | null,
        public expiredAt: Date,
    ) {}

    consume() {
        if (this.estado !== TokenStatus.PENDIENTE) {
            throw new Error('Invitación inválida');
        }

        this.estado = TokenStatus.CONSUMIDO;
        this.consumedAt = new Date();
    }
}
