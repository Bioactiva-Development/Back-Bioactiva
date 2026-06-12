import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ResetTokenValidatorService } from '@/modules/reset_password/application/services/reset-token-validator.service';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';
import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { InvalidResetTokenException } from '@/modules/reset_password/domain/exeptions/invalid-reset-token.exception';
import { ResetTokenExpiredException } from '@/modules/reset_password/domain/exeptions/reset-token-expired.exception';

describe('ResetTokenValidatorService', () => {
    let service: ResetTokenValidatorService;
    let passwordResetRepository: any;
    let userRepository: any;
    let hashService: any;

    const makeToken = (
        estado: TokenStatus = TokenStatus.PENDIENTE,
        expiredAt: Date = new Date(Date.now() + 60 * 60 * 1000),
    ) =>
        new PasswordResetToken(
            1,
            1,
            'hashed-token',
            estado,
            new Date(),
            null,
            expiredAt,
        );

    const makeUser = () =>
        new User(
            1,
            'John',
            'Doe',
            'john@bioactiva.com',
            'password',
            new Date(),
            UserRole.TRABAJADOR,
            UserState.ACTIVO,
            new Date(),
        );

    beforeEach(() => {
        passwordResetRepository = {
            findByToken: jest.fn(),
            save: jest.fn(),
        };
        userRepository = {
            findById: jest.fn(),
        };
        hashService = {
            hash: jest.fn((token: string) => `hashed-${token}`),
        };

        service = new ResetTokenValidatorService(
            passwordResetRepository,
            userRepository,
            hashService,
        );
    });

    it('should return the token and associated user for a valid pending token', async () => {
        const token = makeToken();
        const user = makeUser();
        passwordResetRepository.findByToken.mockResolvedValue(token);
        userRepository.findById.mockResolvedValue(user);

        const result = await service.resolveValidToken('raw-token');

        expect(result.resetToken).toBe(token);
        expect(result.user).toBe(user);
        expect(passwordResetRepository.findByToken).toHaveBeenCalledWith(
            'hashed-raw-token',
        );
    });

    it('should throw InvalidResetTokenException when token does not exist', async () => {
        passwordResetRepository.findByToken.mockResolvedValue(null);

        await expect(service.resolveValidToken('raw-token')).rejects.toThrow(
            InvalidResetTokenException,
        );
    });

    it('should throw InvalidResetTokenException when token is not pending', async () => {
        passwordResetRepository.findByToken.mockResolvedValue(
            makeToken(TokenStatus.CONSUMIDO),
        );

        await expect(service.resolveValidToken('raw-token')).rejects.toThrow(
            InvalidResetTokenException,
        );
    });

    it('should mark token as expired, persist it and throw when past expiry', async () => {
        const expiredToken = makeToken(
            TokenStatus.PENDIENTE,
            new Date(Date.now() - 1000),
        );
        passwordResetRepository.findByToken.mockResolvedValue(expiredToken);

        await expect(service.resolveValidToken('raw-token')).rejects.toThrow(
            ResetTokenExpiredException,
        );
        expect(expiredToken.estado).toBe(TokenStatus.EXPIRADO);
        expect(passwordResetRepository.save).toHaveBeenCalledWith(expiredToken);
    });

    it('should throw InvalidResetTokenException when the associated user is missing', async () => {
        passwordResetRepository.findByToken.mockResolvedValue(makeToken());
        userRepository.findById.mockResolvedValue(null);

        await expect(service.resolveValidToken('raw-token')).rejects.toThrow(
            InvalidResetTokenException,
        );
    });
});
