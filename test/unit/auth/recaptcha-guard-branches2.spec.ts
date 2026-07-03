import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
    RecaptchaGuard,
    RECAPTCHA_TOKEN_HEADER,
} from '@/modules/auth/infrastructure/http/guards/recaptcha.guard';

/**
 * Branch coverage extra para
 * `Array.isArray(headerValue) ? headerValue[0] : headerValue`: cuando el header
 * x-recaptcha-token llega como ARREGLO, se toma el primer elemento.
 */
describe('Auth module — RecaptchaGuard branches2', () => {
    let verifier: any;
    let config: any;
    let reflector: any;
    let guard: RecaptchaGuard;

    const buildContext = (headers: Record<string, unknown>) =>
        ({
            switchToHttp: () => ({
                getRequest: () => ({ headers }),
            }),
            getHandler: () => ({}),
            getClass: () => ({}),
        }) as any;

    beforeEach(() => {
        verifier = { verify: jest.fn() };
        config = { loginAction: 'login', minScore: 0.5 };
        reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) };
        guard = new RecaptchaGuard(verifier, config, reflector);
    });

    it('uses the first element when the recaptcha header is an array', async () => {
        verifier.verify.mockResolvedValue({ valid: true, score: 0.9 });

        const context = buildContext({
            [RECAPTCHA_TOKEN_HEADER]: ['tok-primero', 'tok-segundo'],
        });

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(verifier.verify).toHaveBeenCalledWith('tok-primero', 'login');
    });
});
