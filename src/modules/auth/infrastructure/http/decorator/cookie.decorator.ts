import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

interface RequestWithCookies extends Request {
    cookies: Record<string, string | undefined>;
}

export const ExtractCookie = createParamDecorator(
    (cookieName: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<RequestWithCookies>();
        return request.cookies?.[cookieName] ?? null;
    },
);
