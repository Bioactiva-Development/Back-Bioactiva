import { describe, expect, it } from '@jest/globals';
import { LoginDto } from '@/modules/auth/infrastructure/http/dtos/login.dto.http';
import { RefreshSessionDto } from '@/modules/auth/infrastructure/http/dtos/refresh-session.dto.http';
import { RequestResetDto } from '@/modules/reset_password/infrastructure/http/dto/request-reset.dto.http';
import { ResetPasswordDto } from '@/modules/reset_password/infrastructure/http/dto/reset-password.dto.http';
import { ValidateTokenDto } from '@/modules/reset_password/infrastructure/http/dto/validate-token.dto.http';
import { AcceptInvitationDto } from '@/modules/invitations/infrastructure/http/dto/accept-invitation.dto.htpp';
import { CreateInvitationDto } from '@/modules/invitations/infrastructure/http/dto/create-invitation.dto.http';
import { UserRole } from '@/shared/domain/enums/rol';

describe('Auth DTOs', () => {
    describe('LoginDto', () => {
        it('should create instance with correo and password', () => {
            const dto = new LoginDto('test@example.com', 'password123');
            expect(dto.correo).toBe('test@example.com');
            expect(dto.password).toBe('password123');
        });
    });

    describe('RefreshSessionDto', () => {
        it('should create instance with refreshToken', () => {
            const dto = new RefreshSessionDto('refresh-token-value');
            expect(dto.refreshToken).toBe('refresh-token-value');
        });
    });

    describe('RequestResetDto', () => {
        it('should create instance with correo', () => {
            const dto = new RequestResetDto('user@example.com');
            expect(dto.correo).toBe('user@example.com');
        });
    });

    describe('ResetPasswordDto', () => {
        it('should create instance with token, password and confirmPassword', () => {
            const dto = new ResetPasswordDto('token123', 'newPass123', 'newPass123');
            expect(dto.token).toBe('token123');
            expect(dto.password).toBe('newPass123');
            expect(dto.confirmPassword).toBe('newPass123');
        });
    });

    describe('ValidateTokenDto', () => {
        it('should create instance with token', () => {
            const dto = new ValidateTokenDto('token-abc');
            expect(dto.token).toBe('token-abc');
        });
    });

    describe('AcceptInvitationDto', () => {
        it('should create instance with all fields', () => {
            const dto = new AcceptInvitationDto('token', 'pass', 'Juan', 'Perez', 'pass');
            expect(dto.token).toBe('token');
            expect(dto.password).toBe('pass');
            expect(dto.nombres).toBe('Juan');
            expect(dto.apellidos).toBe('Perez');
            expect(dto.confirmPassword).toBe('pass');
        });
    });

    describe('CreateInvitationDto', () => {
        it('should create instance with correo and rol', () => {
            const dto = new CreateInvitationDto('user@example.com', UserRole.TRABAJADOR);
            expect(dto.correo).toBe('user@example.com');
            expect(dto.rol).toBe(UserRole.TRABAJADOR);
        });

        it('should accept ADMINISTRADOR role', () => {
            const dto = new CreateInvitationDto('admin@example.com', UserRole.ADMINISTRADOR);
            expect(dto.rol).toBe(UserRole.ADMINISTRADOR);
        });
    });
});
