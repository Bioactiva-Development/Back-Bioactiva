import { TokenStatus } from '@/shared/enums/token_estado';

export class PasswordResetToken {
    constructor(
        public readonly id: string,
        public readonly user_id: number,
        public readonly token: string,
        public estado: TokenStatus = TokenStatus.PENDIENTE,
        public readonly created_at: Date,
        public consumed_at: Date | null,
        public expired_at: Date,
    ) {}

    consume() {
        if (this.estado !== TokenStatus.PENDIENTE) {
            throw new Error('Token inválido');
        }

        this.estado = TokenStatus.CONSUMIDO;
        this.consumed_at = new Date();
    }
}
