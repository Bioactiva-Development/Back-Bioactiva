import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MicrosoftIntegrationController } from '@/modules/integrations/infrastructure/http/microsoft-integration.controller';
import { DEFAULT_RETURN_PATH } from '@/modules/integrations/application/microsoft-return-path';

describe('MicrosoftIntegrationController (branches)', () => {
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

    it('connect delegates with undefined returnTo when omitted', async () => {
        connect.execute.mockResolvedValue({ url: 'https://login' });

        await controller.connect({ id: 5 } as any);

        expect(connect.execute).toHaveBeenCalledWith(5, undefined);
    });

    it('callback falls back to the default path when state has no encoded return path', async () => {
        callback.execute.mockResolvedValue(undefined);
        const res: any = { redirect: jest.fn() };

        await controller.callback(
            { state: '42:nonce', code: 'auth-code' } as any,
            res,
        );

        expect(res.redirect).toHaveBeenCalledWith(
            expect.stringContaining(`${DEFAULT_RETURN_PATH}?microsoft=connected`),
        );
    });

    it('callback falls back to the default path when the encoded return path is malformed', async () => {
        callback.execute.mockResolvedValue(undefined);
        const res: any = { redirect: jest.fn() };

        // "%E0%A4%A" is an invalid percent-encoding so decodeURIComponent throws,
        // exercising the catch branch of resolveReturnPath.
        await controller.callback(
            { state: '42:nonce:%E0%A4%A', code: 'auth-code' } as any,
            res,
        );

        expect(res.redirect).toHaveBeenCalledWith(
            expect.stringContaining(`${DEFAULT_RETURN_PATH}?microsoft=connected`),
        );
    });
});
