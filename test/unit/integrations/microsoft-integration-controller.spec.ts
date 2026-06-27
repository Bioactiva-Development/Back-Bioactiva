import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MicrosoftIntegrationController } from '@/modules/integrations/infrastructure/http/microsoft-integration.controller';
import { signOAuthState } from '@/modules/integrations/application/oauth-state';

describe('Integrations module', () => {
    describe('MicrosoftIntegrationController', () => {
        let controller: MicrosoftIntegrationController;
        let connect: any;
        let callback: any;
        let status: any;
        let disconnect: any;

        beforeEach(() => {
            connect = { execute: jest.fn() };
            callback = { execute: jest.fn() };
            status = { execute: jest.fn() };
            disconnect = { execute: jest.fn() };
            controller = new MicrosoftIntegrationController(
                connect,
                callback,
                status,
                disconnect,
            );
        });

        it('connect delegates with the current user id and returnTo', async () => {
            connect.execute.mockResolvedValue({ url: 'https://login' });
            const result = await controller.connect(
                { id: 5 } as any,
                '/notificaciones',
            );
            expect(connect.execute).toHaveBeenCalledWith(5, '/notificaciones');
            expect(result).toEqual({ url: 'https://login' });
        });

        it('status delegates with the current user id', async () => {
            status.execute.mockResolvedValue({ connected: true });
            const result = await controller.status({ id: 5 } as any);
            expect(status.execute).toHaveBeenCalledWith(5);
            expect(result).toEqual({ connected: true });
        });

        it('disconnect delegates with the current user id', async () => {
            disconnect.execute.mockResolvedValue({ ok: true });
            const result = await controller.disconnect({ id: 5 } as any);
            expect(disconnect.execute).toHaveBeenCalledWith(5);
            expect(result).toEqual({ ok: true });
        });

        it('callback parses the user id from a valid signed state and redirects on success', async () => {
            callback.execute.mockResolvedValue(undefined);
            const res: any = { redirect: jest.fn() };
            const payload = '42:nonce:%2F';
            const state = `${payload}:${signOAuthState(payload)}`;

            await controller.callback({ state, code: 'auth-code' } as any, res);

            expect(callback.execute).toHaveBeenCalledWith('auth-code', 42);
            expect(res.redirect).toHaveBeenCalledWith(
                expect.stringContaining('microsoft=connected'),
            );
        });

        it('callback redirects to the returnTo path encoded in the state', async () => {
            callback.execute.mockResolvedValue(undefined);
            const res: any = { redirect: jest.fn() };
            const encoded = encodeURIComponent('/notificaciones');
            const payload = `42:nonce:${encoded}`;
            const state = `${payload}:${signOAuthState(payload)}`;

            await controller.callback({ state, code: 'auth-code' } as any, res);

            expect(res.redirect).toHaveBeenCalledWith(
                expect.stringContaining('/notificaciones?microsoft=connected'),
            );
        });

        it('callback redirects to error when the use case throws', async () => {
            callback.execute.mockRejectedValue(new Error('oauth failed'));
            const res: any = { redirect: jest.fn() };
            const payload = '42:nonce:%2F';
            const state = `${payload}:${signOAuthState(payload)}`;

            await controller.callback({ state, code: 'bad' } as any, res);

            expect(res.redirect).toHaveBeenCalledWith(
                expect.stringContaining('microsoft=error'),
            );
        });

        it('callback redirects to error immediately when state signature is invalid', async () => {
            callback.execute.mockResolvedValue(undefined);
            const res: any = { redirect: jest.fn() };

            await controller.callback(
                { state: '42:nonce:%2F:invalidsig', code: 'auth-code' } as any,
                res,
            );

            expect(callback.execute).not.toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalledWith(
                expect.stringContaining('microsoft=error'),
            );
        });
    });
});
