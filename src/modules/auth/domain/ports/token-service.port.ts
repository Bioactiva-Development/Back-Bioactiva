import {
    JwtClaims,
    RefreshJwtClaims,
} from '@/modules/auth/domain/value-objects/jwt_claims';

export interface TokenServicePort {
    signAccessToken(payload: JwtClaims): Promise<string> | string;
    verifyAccessToken(token: string): Promise<JwtClaims> | JwtClaims;
    signRefreshToken(payload: RefreshJwtClaims): Promise<string> | string;
    verifyRefreshToken(
        token: string,
    ): Promise<RefreshJwtClaims> | RefreshJwtClaims;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
