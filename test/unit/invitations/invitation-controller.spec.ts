import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { InvitationController } from '@/modules/invitations/infrastructure/http/invitation.controller';
import { CreateInvitationUseCase } from '@/modules/invitations/application/use-cases/create-invitation.use-case';
import { AcceptInvitationUseCase } from '@/modules/invitations/application/use-cases/accept-invitation.use-case';
import { RevokeInvitationUseCase } from '@/modules/invitations/application/use-cases/revoke-invitation.use-case';
import { ObtainInfoUseCase } from '@/modules/invitations/application/use-cases/obtain-info-use-case';
import { ListInvitationsUseCase } from '@/modules/invitations/application/use-cases/list-invitations.use-case';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('InvitationController', () => {
    let controller: InvitationController;
    let createInvitationUseCase: jest.Mocked<CreateInvitationUseCase>;
    let acceptInvitationUseCase: jest.Mocked<AcceptInvitationUseCase>;
    let revokeInvitationUseCase: jest.Mocked<RevokeInvitationUseCase>;
    let obtainInfoUseCase: jest.Mocked<ObtainInfoUseCase>;
    let listInvitationsUseCase: jest.Mocked<ListInvitationsUseCase>;

    const mockUser = new User(1, 'Admin', 'User', 'admin@test.com', 'hash', new Date(), UserRole.ADMINISTRADOR, UserState.ACTIVO, new Date());

    beforeEach(async () => {
        createInvitationUseCase = { execute: jest.fn() } as any;
        acceptInvitationUseCase = { execute: jest.fn() } as any;
        revokeInvitationUseCase = { execute: jest.fn() } as any;
        obtainInfoUseCase = { execute: jest.fn() } as any;
        listInvitationsUseCase = { execute: jest.fn() } as any;

        const module = await Test.createTestingModule({
            controllers: [InvitationController],
            providers: [
                { provide: CreateInvitationUseCase, useValue: createInvitationUseCase },
                { provide: AcceptInvitationUseCase, useValue: acceptInvitationUseCase },
                { provide: RevokeInvitationUseCase, useValue: revokeInvitationUseCase },
                { provide: ObtainInfoUseCase, useValue: obtainInfoUseCase },
                { provide: ListInvitationsUseCase, useValue: listInvitationsUseCase },
            ],
        }).compile();

        controller = module.get(InvitationController);
    });

    it('should create invitation', async () => {
        createInvitationUseCase.execute.mockResolvedValue({ id: 1 });

        const result = await controller.createInvitation(mockUser, { correo: 'user@test.com', rol: UserRole.TRABAJADOR });

        expect(createInvitationUseCase.execute).toHaveBeenCalledWith(mockUser, 'user@test.com', UserRole.TRABAJADOR);
        expect(result).toEqual({ id: 1 });
    });

    it('should list invitations', async () => {
        listInvitationsUseCase.execute.mockResolvedValue([]);

        const result = await controller.listInvitations(mockUser, 1, 10, 'test', undefined);

        expect(listInvitationsUseCase.execute).toHaveBeenCalledWith(1, 10, 'test', undefined);
    });

    it('should obtain invitation info', async () => {
        obtainInfoUseCase.execute.mockResolvedValue({ correo: 'user@test.com' });

        const result = await controller.obtainInfo('token-abc');

        expect(obtainInfoUseCase.execute).toHaveBeenCalledWith('token-abc');
        expect(result).toEqual({ correo: 'user@test.com' });
    });

    it('should accept invitation when passwords match', async () => {
        acceptInvitationUseCase.execute.mockResolvedValue({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            accessTokenExpiresIn: 900,
            refreshTokenExpiresIn: 604800,
        } as any);
        const response = { cookie: jest.fn() } as any;

        const result = await controller.acceptInvitation({ token: 'token', password: 'pass123', confirmPassword: 'pass123', nombres: 'Juan', apellidos: 'Perez' }, response);

        expect(acceptInvitationUseCase.execute).toHaveBeenCalledWith('token', 'pass123', 'Juan', 'Perez');
        expect(response.cookie).toHaveBeenCalled();
        expect(result).toMatchObject({ accessToken: 'access-token' });
    });

    it('should throw when passwords do not match on accept', async () => {
        const response = { cookie: jest.fn() } as any;
        await expect(controller.acceptInvitation({ token: 'token', password: 'pass1', confirmPassword: 'pass2', nombres: 'Juan', apellidos: 'Perez' }, response))
            .rejects.toThrow(BadRequestException);
    });

    it('should revoke invitation', async () => {
        revokeInvitationUseCase.execute.mockResolvedValue({ success: true });

        const result = await controller.revokeInvitation(1);

        expect(revokeInvitationUseCase.execute).toHaveBeenCalledWith(1);
        expect(result).toEqual({ success: true });
    });
});
