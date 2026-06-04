import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ResetPasswordController } from '@/modules/reset_password/infrastructure/http/reset-password.controller';
import { RequestPasswordResetUseCase } from '@/modules/reset_password/application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '@/modules/reset_password/application/use-cases/reset-password.use-case';
import { ValidateResetTokenUseCase } from '@/modules/reset_password/application/use-cases/validate-reset-token.use-case';
import { ObtainResetInfoUseCase } from '@/modules/reset_password/application/use-cases/obtain-reset-info.use-case';

describe('ResetPasswordController', () => {
    let controller: ResetPasswordController;
    let requestPasswordResetUseCase: jest.Mocked<RequestPasswordResetUseCase>;
    let resetPasswordUseCase: jest.Mocked<ResetPasswordUseCase>;
    let validateResetTokenUseCase: jest.Mocked<ValidateResetTokenUseCase>;
    let obtainResetInfoUseCase: jest.Mocked<ObtainResetInfoUseCase>;

    beforeEach(async () => {
        requestPasswordResetUseCase = { execute: jest.fn() } as any;
        resetPasswordUseCase = { execute: jest.fn() } as any;
        validateResetTokenUseCase = { execute: jest.fn() } as any;
        obtainResetInfoUseCase = { execute: jest.fn() } as any;

        const module = await Test.createTestingModule({
            controllers: [ResetPasswordController],
            providers: [
                { provide: RequestPasswordResetUseCase, useValue: requestPasswordResetUseCase },
                { provide: ResetPasswordUseCase, useValue: resetPasswordUseCase },
                { provide: ValidateResetTokenUseCase, useValue: validateResetTokenUseCase },
                { provide: ObtainResetInfoUseCase, useValue: obtainResetInfoUseCase },
            ],
        }).compile();

        controller = module.get(ResetPasswordController);
    });

    it('should request password reset', async () => {
        requestPasswordResetUseCase.execute.mockResolvedValue({ message: 'Email sent' });
        const result = await controller.requestReset({ correo: 'user@test.com' });
        expect(requestPasswordResetUseCase.execute).toHaveBeenCalledWith('user@test.com');
        expect(result).toEqual({ message: 'Email sent' });
    });

    it('should reset password when passwords match', async () => {
        resetPasswordUseCase.execute.mockResolvedValue({ success: true });
        const result = await controller.resetPassword({ token: 'token', password: 'newPass123', confirmPassword: 'newPass123' });
        expect(resetPasswordUseCase.execute).toHaveBeenCalledWith('token', 'newPass123');
        expect(result).toEqual({ success: true });
    });

    it('should throw when passwords do not match on reset', async () => {
        await expect(controller.resetPassword({ token: 'token', password: 'pass1', confirmPassword: 'pass2' }))
            .rejects.toThrow(BadRequestException);
    });

    it('should validate token', async () => {
        validateResetTokenUseCase.execute.mockResolvedValue({ valid: true });
        const result = await controller.validateToken({ token: 'valid-token' });
        expect(validateResetTokenUseCase.execute).toHaveBeenCalledWith('valid-token');
        expect(result).toEqual({ valid: true });
    });

    it('should obtain reset token info on URL resolution (Mantis #240)', async () => {
        obtainResetInfoUseCase.execute.mockResolvedValue({
            correo: 'j***n@test.com',
            expired: true,
            used: false,
        });
        const result = await controller.obtainInfo('some-token');
        expect(obtainResetInfoUseCase.execute).toHaveBeenCalledWith('some-token');
        expect(result).toEqual({
            correo: 'j***n@test.com',
            expired: true,
            used: false,
        });
    });
});
