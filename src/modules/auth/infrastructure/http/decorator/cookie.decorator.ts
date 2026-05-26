import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

interface RequestWithCookies extends Request {
    cookies: Record<string, string | undefined>;
}

export function extractCookieFromRequest(
    cookieName: string,
    req: RequestWithCookies,
) {
    return req?.cookies?.[cookieName] ?? null;
}

export const ExtractCookie = createParamDecorator(
    (cookieName: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<RequestWithCookies>();
        return extractCookieFromRequest(cookieName, request);
    },
);
