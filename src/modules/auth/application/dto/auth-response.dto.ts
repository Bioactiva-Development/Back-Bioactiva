import { TokenPair } from '@/modules/auth/domain/value-objects/token_pair';

export class AuthResponseDto {
    constructor(
        public readonly accessToken: string,
        public readonly refreshToken: string,
        public readonly accessTokenExpiresIn: number,
        public readonly refreshTokenExpiresIn: number,
    ) {}

    static fromTokenPair(tokenPair: TokenPair): AuthResponseDto {
        return new AuthResponseDto(
            tokenPair.accessToken,
            tokenPair.refreshToken,
            tokenPair.accessTokenExpiresIn,
            tokenPair.refreshTokenExpiresIn,
        );
    }
}
