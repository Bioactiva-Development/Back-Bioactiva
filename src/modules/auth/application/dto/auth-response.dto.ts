export class AuthResponseDto {
    constructor(
        public readonly accessToken: string,
        public readonly accessTokenExpiresIn: number,
    ) {}

    static fromTokenPair(
        accessToken: string,
        accessTokenExpiresIn: number,
    ): AuthResponseDto {
        return new AuthResponseDto(accessToken, accessTokenExpiresIn);
    }
}
