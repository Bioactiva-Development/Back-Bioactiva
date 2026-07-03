const DEFAULT_REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

/**
 * Se resuelve en cada llamada (no como constante de módulo) porque el archivo
 * .env se carga vía ConfigModule.forRoot() durante el bootstrap de Nest, que
 * ocurre después de que este módulo es importado por los controllers.
 * Leer process.env.REFRESH_TOKEN_COOKIE_NAME a nivel de módulo vería `undefined`.
 */
export function getRefreshTokenCookieName(): string {
    return (
        process.env.REFRESH_TOKEN_COOKIE_NAME?.trim() ||
        DEFAULT_REFRESH_TOKEN_COOKIE_NAME
    );
}
