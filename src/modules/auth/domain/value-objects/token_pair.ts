export class TokenPair {
    constructor(
        public readonly accessToken: string,
        public readonly refreshToken: string,
        public readonly accessTokenExpiresIn: number,
        public readonly refreshTokenExpiresIn: number,
    ) {}
}
