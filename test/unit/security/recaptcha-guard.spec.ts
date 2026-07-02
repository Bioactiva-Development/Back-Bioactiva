import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import {
    RecaptchaGuard,
    RECAPTCHA_TOKEN_HEADER,
} from '@/modules/auth/infrastructure/http/guards/recaptcha.guard';
import type { RecaptchaVerifierPort } from '@/modules/auth/domain/ports/recaptcha-verifier.port';
import type { RecaptchaConfig } from '@/modules/auth/infrastructure/config/recaptcha.config';

describe('Security module', () => {
    describe('RecaptchaGuard', () => {
        let guard: RecaptchaGuard;
        let verifier: jest.Mocked<RecaptchaVerifierPort>;
        let config: RecaptchaConfig;
        let reflector: jest.Mocked<Reflector>;

        const buildContext = (headers: Record<string, unknown>) =>
            ({
                switchToHttp: () => ({
                    getRequest: () => ({ headers }),
                }),
                getHandler: () => ({}),
                getClass: () => ({}),
            }) as unknown as ExecutionContext;

        beforeEach(() => {
            verifier = {
                verify: jest.fn(),
            } as unknown as jest.Mocked<RecaptchaVerifierPort>;

            config = {
                minScore: 0.5,
                loginAction: 'login',
            } as unknown as RecaptchaConfig;

            // Sin @RecaptchaAction en el endpoint: el reflector no encuentra
            // metadata y el guard usa la action de login.
            reflector = {
                getAllAndOverride: jest.fn().mockReturnValue(undefined),
            } as unknown as jest.Mocked<Reflector>;

            guard = new RecaptchaGuard(verifier, config, reflector);
        });

        it('permite el acceso cuando el token es válido y el score supera el umbral', async () => {
            verifier.verify.mockResolvedValue({ valid: true, score: 0.9 });

            const context = buildContext({
                [RECAPTCHA_TOKEN_HEADER]: 'valid-token',
            });

            await expect(guard.canActivate(context)).resolves.toBe(true);
            expect(verifier.verify).toHaveBeenCalledWith('valid-token', 'login');
        });

        it('rechaza cuando no se envía el token de reCAPTCHA', async () => {
            const context = buildContext({});

            await expect(guard.canActivate(context)).rejects.toThrow(
                UnauthorizedException,
            );
            expect(verifier.verify).not.toHaveBeenCalled();
        });

        it('rechaza cuando el score está por debajo del umbral mínimo', async () => {
            verifier.verify.mockResolvedValue({ valid: true, score: 0.3 });

            const context = buildContext({
                [RECAPTCHA_TOKEN_HEADER]: 'low-score-token',
            });

            await expect(guard.canActivate(context)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('usa la action fijada con @RecaptchaAction cuando el endpoint la define', async () => {
            reflector.getAllAndOverride.mockReturnValue('password_reset');
            verifier.verify.mockResolvedValue({ valid: true, score: 0.9 });

            const context = buildContext({
                [RECAPTCHA_TOKEN_HEADER]: 'valid-token',
            });

            await expect(guard.canActivate(context)).resolves.toBe(true);
            expect(verifier.verify).toHaveBeenCalledWith(
                'valid-token',
                'password_reset',
            );
        });

        it('rechaza cuando el token es inválido', async () => {
            verifier.verify.mockResolvedValue({ valid: false, score: 0 });

            const context = buildContext({
                [RECAPTCHA_TOKEN_HEADER]: 'invalid-token',
            });

            await expect(guard.canActivate(context)).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });
});
