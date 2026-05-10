import { TokenStatus } from '@/shared/enums/token_estado';

export class PasswordResetToken {
    constructor(
        public readonly id: string,
        public readonly userId: number,
        public readonly token: string,
        public estado: TokenStatus = TokenStatus.PENDIENTE,
        public readonly createdAt: Date,
        public consumedAt: Date | null,
        public expiredAt: Date,
    ) {}

    consume() {
        if (this.estado !== TokenStatus.PENDIENTE) {
            throw new Error('Token inválido');
        }

        this.estado = TokenStatus.CONSUMIDO;
        this.consumedAt = new Date();
    }
}
