import { User } from '@/modules/users/domain/entities/user';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    user?: User;
}

export const CurrentUser = createParamDecorator(
    (_: unknown, context: ExecutionContext) => {
        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();
        return request.user;
    },
);
