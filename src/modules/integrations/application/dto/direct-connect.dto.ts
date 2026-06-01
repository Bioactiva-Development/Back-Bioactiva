export class DirectConnectDto {
    constructor(
        public readonly accessToken: string,
        public readonly refreshToken: string | null,
        public readonly microsoftEmail: string,
        public readonly microsoftOid: string,
        public readonly expiresIn: number | null,
    ) {}
}
