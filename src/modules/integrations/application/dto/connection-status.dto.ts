export class ConnectionStatusDto {
    constructor(
        public readonly connected: boolean,
        public readonly microsoftEmail: string | null,
    ) {}
}
