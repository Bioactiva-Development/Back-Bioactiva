import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

export interface JwtClaims {
    sub: string;
    correo: string;
    nombres: string;
    apellidos: string;
    role: UserRole;
    estado: UserState;
    tokenVersion?: number;
}

export interface RefreshJwtClaims {
    sub: string;
    tokenVersion?: number;
}
