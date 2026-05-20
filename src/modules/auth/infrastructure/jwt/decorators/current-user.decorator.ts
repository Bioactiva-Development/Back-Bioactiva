import { User } from '@/modules/users/domain/entities/user';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    user?: User;
}

export function currentUserFromRequest(
    req: AuthenticatedRequest,
): User | undefined {
    return req?.user;
}

export const CurrentUser = createParamDecorator(
    (_: unknown, context: ExecutionContext) => {
        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();
        return currentUserFromRequest(request);
    },
);
