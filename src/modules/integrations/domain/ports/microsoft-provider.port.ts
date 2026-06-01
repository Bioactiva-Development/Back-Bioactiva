export interface TokenResponse {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
}

export interface MicrosoftProfile {
    email: string;
    oid: string;
}

export interface MicrosoftProviderPort {
    getAuthUrl(state: string): Promise<string>;
    exchangeCodeForTokens(code: string): Promise<TokenResponse>;
    getProfile(accessToken: string): Promise<MicrosoftProfile>;
    refreshAccessToken(refreshToken: string): Promise<TokenResponse>;
}

export const MICROSOFT_PROVIDER = Symbol('MICROSOFT_PROVIDER');
