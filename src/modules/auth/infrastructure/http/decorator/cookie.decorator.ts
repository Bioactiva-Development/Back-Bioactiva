import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { getRefreshTokenCookieName } from '@/modules/auth/infrastructure/http/cookie-names';

interface RequestWithCookies extends Request {
    cookies: Record<string, string | undefined>;
}

export function extractCookieFromRequest(
    cookieName: string,
    req: RequestWithCookies,
) {
    return req?.cookies?.[cookieName] ?? null;
}

/**
 * `cookieName` es opcional: sin argumento se resuelve con
 * getRefreshTokenCookieName() en tiempo de request, lo que respeta
 * REFRESH_TOKEN_COOKIE_NAME aunque el .env se cargue después de que este
 * decorator se aplicó (ver cookie-names.ts).
 */
export const ExtractCookie = createParamDecorator(
    (cookieName: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<RequestWithCookies>();
        return extractCookieFromRequest(
            cookieName ?? getRefreshTokenCookieName(),
            request,
        );
    },
);
