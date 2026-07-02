import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RECAPTCHA_VERIFIER } from '@/modules/auth/domain/ports/recaptcha-verifier.port';
import type { RecaptchaVerifierPort } from '@/modules/auth/domain/ports/recaptcha-verifier.port';
import { RecaptchaConfig } from '@/modules/auth/infrastructure/config/recaptcha.config';
import { RECAPTCHA_ACTION_KEY } from '@/modules/auth/infrastructure/http/decorator/recaptcha-action.decorator';

export const RECAPTCHA_TOKEN_HEADER = 'x-recaptcha-token';

@Injectable()
export class RecaptchaGuard implements CanActivate {
    constructor(
        @Inject(RECAPTCHA_VERIFIER)
        private readonly verifier: RecaptchaVerifierPort,
        private readonly config: RecaptchaConfig,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const headerValue = request.headers[RECAPTCHA_TOKEN_HEADER];
        const token = Array.isArray(headerValue) ? headerValue[0] : headerValue;

        if (!token) {
            throw new UnauthorizedException('Token de reCAPTCHA requerido');
        }

        // La action esperada la fija @RecaptchaAction en el endpoint; sin
        // decorator se conserva la de login (comportamiento original).
        const expectedAction =
            this.reflector.getAllAndOverride<string | undefined>(
                RECAPTCHA_ACTION_KEY,
                [context.getHandler(), context.getClass()],
            ) ?? this.config.loginAction;

        const { valid, score } = await this.verifier.verify(
            token,
            expectedAction,
        );

        if (!valid || score < this.config.minScore) {
            throw new UnauthorizedException(
                'Verificación de reCAPTCHA fallida',
            );
        }

        return true;
    }
}
