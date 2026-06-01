export class MicrosoftIntegration {
    constructor(
        public readonly id: number | null,
        public readonly idUsuario: number,
        public microsoftEmail: string,
        public microsoftOid: string,
        public refreshToken: string | null,
        public tokenExpiresAt: Date | null,
        public conectado: boolean,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) {}

    markAsConnected(
        email: string,
        oid: string,
        refreshToken: string | null,
        expiresAt: Date | null,
    ) {
        this.microsoftEmail = email;
        this.microsoftOid = oid;
        this.refreshToken = refreshToken;
        this.tokenExpiresAt = expiresAt;
        this.conectado = true;
        this.updatedAt = new Date();
    }

    disconnect() {
        this.conectado = false;
        this.refreshToken = null;
        this.tokenExpiresAt = null;
        this.updatedAt = new Date();
    }
}
