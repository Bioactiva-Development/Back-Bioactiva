import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { InvitationController } from '@/modules/invitations/infrastructure/http/invitation.controller';
import { CreateInvitationUseCase } from '@/modules/invitations/application/use-cases/create-invitation.use-case';
import { AcceptInvitationUseCase } from '@/modules/invitations/application/use-cases/accept-invitation.use-case';
import { RevokeInvitationUseCase } from '@/modules/invitations/application/use-cases/revoke-invitation.use-case';
import { ObtainInfoUseCase } from '@/modules/invitations/application/use-cases/obtain-info-use-case';
import { ListInvitationsUseCase } from '@/modules/invitations/application/use-cases/list-invitations.use-case';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('InvitationController (branches)', () => {
    let controller: InvitationController;
    let acceptInvitationUseCase: jest.Mocked<AcceptInvitationUseCase>;
    let listInvitationsUseCase: jest.Mocked<ListInvitationsUseCase>;

    const mockUser = new User(
        1,
        'Admin',
        'User',
        'admin@test.com',
        'hash',
        new Date(),
        UserRole.ADMINISTRADOR,
        UserState.ACTIVO,
        new Date(),
    );

    beforeEach(async () => {
        acceptInvitationUseCase = { execute: jest.fn() } as any;
        listInvitationsUseCase = { execute: jest.fn() } as any;

        const module = await Test.createTestingModule({
            controllers: [InvitationController],
            providers: [
                {
                    provide: CreateInvitationUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: AcceptInvitationUseCase,
                    useValue: acceptInvitationUseCase,
                },
                {
                    provide: RevokeInvitationUseCase,
                    useValue: { execute: jest.fn() },
                },
                { provide: ObtainInfoUseCase, useValue: { execute: jest.fn() } },
                {
                    provide: ListInvitationsUseCase,
                    useValue: listInvitationsUseCase,
                },
            ],
        }).compile();

        controller = module.get(InvitationController);
    });

    it('listInvitations forwards all filters when present', async () => {
        listInvitationsUseCase.execute.mockResolvedValue([]);

        await controller.listInvitations(
            mockUser,
            2,
            20,
            'someone',
            'PENDIENTE' as any,
        );

        expect(listInvitationsUseCase.execute).toHaveBeenCalledWith(
            2,
            20,
            'someone',
            'PENDIENTE',
        );
    });

    it('listInvitations forwards undefined filters when all are omitted', async () => {
        listInvitationsUseCase.execute.mockResolvedValue([]);

        await controller.listInvitations(mockUser);

        expect(listInvitationsUseCase.execute).toHaveBeenCalledWith(
            undefined,
            undefined,
            undefined,
            undefined,
        );
    });

    it('acceptInvitation sets a secure + SameSite=None cookie in production', async () => {
        const previous = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        acceptInvitationUseCase.execute.mockResolvedValue({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            accessTokenExpiresIn: 900,
            refreshTokenExpiresIn: 604800,
        });
        const response = { cookie: jest.fn() } as any;

        try {
            await controller.acceptInvitation(
                {
                    token: 'token',
                    password: 'pass123',
                    confirmPassword: 'pass123',
                    nombres: 'Juan',
                    apellidos: 'Perez',
                },
                response,
            );

            expect(response.cookie).toHaveBeenCalledWith(
                expect.any(String),
                'refresh-token',
                expect.objectContaining({ secure: true, sameSite: 'none' }),
            );
        } finally {
            process.env.NODE_ENV = previous;
        }
    });

    it('acceptInvitation uses Lax + non-secure cookie outside production', async () => {
        const previous = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        acceptInvitationUseCase.execute.mockResolvedValue({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            accessTokenExpiresIn: 900,
            refreshTokenExpiresIn: 604800,
        });
        const response = { cookie: jest.fn() } as any;

        try {
            await controller.acceptInvitation(
                {
                    token: 'token',
                    password: 'pass123',
                    confirmPassword: 'pass123',
                    nombres: 'Juan',
                    apellidos: 'Perez',
                },
                response,
            );

            expect(response.cookie).toHaveBeenCalledWith(
                expect.any(String),
                'refresh-token',
                expect.objectContaining({ secure: false, sameSite: 'lax' }),
            );
        } finally {
            process.env.NODE_ENV = previous;
        }
    });
});
