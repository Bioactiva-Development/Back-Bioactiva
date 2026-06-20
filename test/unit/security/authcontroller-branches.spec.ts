import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { Response } from 'express';

import { AuthController } from '@/modules/auth/infrastructure/http/auth.controller';
import { AuthenticateUserUseCase } from '@/modules/auth/application/use-cases/authenticate-user.use-case';
import { RefreshSessionUseCase } from '@/modules/auth/application/use-cases/refresh-session.use-case';
import { TokenPair } from '@/modules/auth/domain/value-objects/token_pair';

describe('AuthController (branches)', () => {
    let controller: AuthController;
    let authenticateUserUseCase: jest.Mocked<AuthenticateUserUseCase>;
    let refreshSessionUseCase: jest.Mocked<RefreshSessionUseCase>;
    let responseMock: jest.Mocked<Response>;

    const buildTokenPair = () =>
        new TokenPair('access-token-value', 'refresh-token-value', 900, 604800);

    beforeEach(() => {
        authenticateUserUseCase = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<AuthenticateUserUseCase>;

        refreshSessionUseCase = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<RefreshSessionUseCase>;

        controller = new AuthController(
            authenticateUserUseCase,
            refreshSessionUseCase,
        );

        responseMock = {
            cookie: jest.fn().mockReturnValue(responseMock),
        } as unknown as jest.Mocked<Response>;
    });

    it('login sets an insecure cookie outside production', async () => {
        delete process.env.NODE_ENV;
        authenticateUserUseCase.execute.mockResolvedValue(buildTokenPair());

        await controller.login(
            { correo: 'ana@bioactiva.com', password: 'password' },
            responseMock,
        );

        expect(responseMock.cookie).toHaveBeenCalledWith(
            'refreshToken',
            'refresh-token-value',
            expect.objectContaining({ secure: false }),
        );
    });

    it('login sets a secure cookie in production', async () => {
        process.env.NODE_ENV = 'production';
        authenticateUserUseCase.execute.mockResolvedValue(buildTokenPair());

        await controller.login(
            { correo: 'ana@bioactiva.com', password: 'password' },
            responseMock,
        );

        expect(responseMock.cookie).toHaveBeenCalledWith(
            'refreshToken',
            'refresh-token-value',
            expect.objectContaining({ secure: true }),
        );

        delete process.env.NODE_ENV;
    });
});
