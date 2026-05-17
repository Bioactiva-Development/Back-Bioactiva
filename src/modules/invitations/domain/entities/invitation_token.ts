import { UserRole } from '@/shared/enums/rol';
import { TokenStatus } from '@/shared/enums/token_estado';

export class InvitationToken {
    constructor(
        public readonly id: string,
        public readonly correo: string,
        public readonly token: string,
        public readonly rol: UserRole,
        public readonly invitador_id: number,
        public estado: TokenStatus = TokenStatus.PENDIENTE,
        public readonly created_at: Date,
        public consumed_at: Date | null,
        public expired_at: Date,
    ) {}

    consume() {
        if (this.estado !== TokenStatus.PENDIENTE) {
            throw new Error('Invitación inválida');
        }

        this.estado = TokenStatus.CONSUMIDO;
        this.consumed_at = new Date();
    }
}
