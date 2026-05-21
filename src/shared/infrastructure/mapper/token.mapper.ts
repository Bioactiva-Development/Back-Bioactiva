import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { TokenStatus as PrismaTokenStatus } from '@prisma/client';
export class TokenMapper {
    static mapTokenStatus(status: PrismaTokenStatus): TokenStatus {
        switch (status) {
            case 'PENDIENTE':
                return TokenStatus.PENDIENTE;
            case 'CONSUMIDO':
                return TokenStatus.CONSUMIDO;
            case 'EXPIRADO':
                return TokenStatus.EXPIRADO;
        }
    }

    static mapTokenStatusToPrisma(status: TokenStatus): PrismaTokenStatus {
        switch (status) {
            case TokenStatus.PENDIENTE:
                return 'PENDIENTE';
            case TokenStatus.CONSUMIDO:
                return 'CONSUMIDO';
            case TokenStatus.EXPIRADO:
                return 'EXPIRADO';
        }
    }
}
