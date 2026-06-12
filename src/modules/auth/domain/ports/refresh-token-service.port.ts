export interface RefreshTokenServicePort {
    generateRefreshToken(userId: string): Promise<string>;
    verifyRefreshToken(token: string): Promise<{ userId: string }>;
}
