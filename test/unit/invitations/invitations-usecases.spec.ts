import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateInvitationUseCase } from '@/modules/invitations/application/use-cases/create-invitation.use-case';
import { AcceptInvitationUseCase } from '@/modules/invitations/application/use-cases/accept-invitation.use-case';
import { RevokeInvitationUseCase } from '@/modules/invitations/application/use-cases/revoke-invitation.use-case';
import { ExpireInvitationUseCase } from '@/modules/invitations/application/use-cases/expire-invitation.use-case';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';
import { InvitationToken } from '@/modules/invitations/domain/entities/invitation_token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { NotAuthorizedException } from '@/modules/auth/domain/exceptions/not-authorized.exeption';
import { InvalidInvitationDomainException } from '@/modules/invitations/domain/exceptions/invalid-invitation-domain.exception';
import { InvalidInvitationTokenException } from '@/modules/invitations/domain/exceptions/invalid-invitation-token.exception';
import { InvitationExpiredException } from '@/modules/invitations/domain/exceptions/invitation-expired.exception';
import { InvitationAlreadyAcceptedException } from '@/modules/invitations/domain/exceptions/invitation-already-accepted.exception';

describe('Invitations module', () => {
    /**
     * CreateInvitationUseCase
     * ----------
     * Responsable de:
     * - validar permisos del actor (debe ser admin)
     * - validar dominio del correo
     * - prevenir duplicados de invitaciones pendientes
     * - crear usuario pendiente y token de invitación
     * - agendar expiración y enviar notificación
     */
    // STATUS: Implementación completa (permission, domain, duplicate checks + creation).
    describe('CreateInvitationUseCase', () => {
        let useCase: CreateInvitationUseCase;
        let invitationsRepository: any;
        let invitationPolicy: any;
        let hashService: any;
        let invitationNotification: any;
        let invitationExpirationScheduler: any;
        let userRepository: any;

        const buildAdmin = () =>
            new User(
                1,
                'Admin',
                'User',
                'admin@bioactiva.com',
                'hashed-password',
                new Date(),
                UserRole.ADMINISTRADOR,
                UserState.ACTIVO,
                new Date(),
            );

        const buildWorker = () =>
            new User(
                2,
                'Worker',
                'User',
                'worker@bioactiva.com',
                'hashed-password',
                new Date(),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date(),
            );

        beforeEach(() => {
            invitationsRepository = {
                findPendingByEmail: jest.fn(),
                save: jest.fn(),
            };
            invitationPolicy = {
                canCreateInvitation: jest.fn(),
                isAllowedDomain: jest.fn(),
            };
            hashService = {
                hash: jest.fn((token: string) => `hashed-${token}`),
            };
            invitationNotification = {
                enqueueInvitationEmail: jest.fn(),
            };
            invitationExpirationScheduler = {
                scheduleExpiration: jest.fn(),
            };
            userRepository = {
                save: jest.fn(),
            };

            useCase = new CreateInvitationUseCase(
                invitationsRepository,
                invitationPolicy,
                hashService,
                invitationNotification,
                invitationExpirationScheduler,
                userRepository,
            );
        });

        it('should create invitation for valid request', async () => {
            const admin = buildAdmin();
            const newEmail = 'newuser@bioactiva.com';

            invitationPolicy.canCreateInvitation.mockReturnValue(true);
            invitationPolicy.isAllowedDomain.mockReturnValue(true);
            invitationsRepository.findPendingByEmail.mockResolvedValue(null);
            invitationsRepository.save.mockResolvedValue({
                id: 1,
                correo: newEmail,
            });

            const result = await useCase.execute(
                admin,
                newEmail,
                UserRole.TRABAJADOR,
            );

            expect(result).toEqual({ ok: true });
            expect(invitationPolicy.canCreateInvitation).toHaveBeenCalledWith(
                admin,
            );
            expect(invitationPolicy.isAllowedDomain).toHaveBeenCalledWith(
                newEmail,
            );
            expect(
                invitationsRepository.findPendingByEmail,
            ).toHaveBeenCalledWith(newEmail);
            expect(userRepository.save).toHaveBeenCalled();
            expect(invitationsRepository.save).toHaveBeenCalled();
        });

        it('should reject if actor is not admin', async () => {
            const worker = buildWorker();

            invitationPolicy.canCreateInvitation.mockReturnValue(false);

            await expect(
                useCase.execute(
                    worker,
                    'user@bioactiva.com',
                    UserRole.TRABAJADOR,
                ),
            ).rejects.toThrow(NotAuthorizedException);
        });

        it('should reject if domain is not allowed', async () => {
            const admin = buildAdmin();

            invitationPolicy.canCreateInvitation.mockReturnValue(true);
            invitationPolicy.isAllowedDomain.mockReturnValue(false);

            await expect(
                useCase.execute(admin, 'user@gmail.com', UserRole.TRABAJADOR),
            ).rejects.toThrow(InvalidInvitationDomainException);
        });

        it('should reject if pending invitation already exists', async () => {
            const admin = buildAdmin();
            const existingInvitation = new InvitationToken(
                1,
                'user@bioactiva.com',
                'token',
                UserRole.TRABAJADOR,
                admin.id!,
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(),
            );

            invitationPolicy.canCreateInvitation.mockReturnValue(true);
            invitationPolicy.isAllowedDomain.mockReturnValue(true);
            invitationsRepository.findPendingByEmail.mockResolvedValue(
                existingInvitation,
            );

            await expect(
                useCase.execute(
                    admin,
                    'user@bioactiva.com',
                    UserRole.TRABAJADOR,
                ),
            ).rejects.toThrow(InvalidInvitationDomainException);
        });

        it('should throw if actor id is null', async () => {
            const adminWithoutId = new User(
                null,
                'Admin',
                'User',
                'admin@bioactiva.com',
                'hashed-password',
                new Date(),
                UserRole.ADMINISTRADOR,
                UserState.ACTIVO,
                new Date(),
            );

            invitationPolicy.canCreateInvitation.mockReturnValue(true);
            invitationPolicy.isAllowedDomain.mockReturnValue(true);
            invitationsRepository.findPendingByEmail.mockResolvedValue(null);

            await expect(
                useCase.execute(
                    adminWithoutId,
                    'user@bioactiva.com',
                    UserRole.TRABAJADOR,
                ),
            ).rejects.toThrow(NotAuthorizedException);
        });

        it('should schedule expiration and send notification', async () => {
            const admin = buildAdmin();
            const newEmail = 'newuser@bioactiva.com';

            invitationPolicy.canCreateInvitation.mockReturnValue(true);
            invitationPolicy.isAllowedDomain.mockReturnValue(true);
            invitationsRepository.findPendingByEmail.mockResolvedValue(null);
            invitationsRepository.save.mockResolvedValue({
                id: 1,
                correo: newEmail,
                expired_at: new Date(),
            });

            await useCase.execute(admin, newEmail, UserRole.ADMINISTRADOR);

            expect(
                invitationExpirationScheduler.scheduleExpiration,
            ).toHaveBeenCalled();
            expect(
                invitationNotification.enqueueInvitationEmail,
            ).toHaveBeenCalled();
        });

        it('should create pending user when creating invitation', async () => {
            const admin = buildAdmin();
            const newEmail = 'newuser@bioactiva.com';

            invitationPolicy.canCreateInvitation.mockReturnValue(true);
            invitationPolicy.isAllowedDomain.mockReturnValue(true);
            invitationsRepository.findPendingByEmail.mockResolvedValue(null);
            invitationsRepository.save.mockResolvedValue({ id: 1 });

            await useCase.execute(admin, newEmail, UserRole.TRABAJADOR);

            expect(userRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    correo: newEmail,
                    estado: UserState.PENDIENTE,
                    role: UserRole.TRABAJADOR,
                }),
            );
        });
    });

    /**
     * AcceptInvitationUseCase
     * ----------
     * Responsable de:
     * - verificar validez del token
     * - validar que no sea duplicado/expirado
     * - validar que dominio sea permitido
     * - crear/activar usuario con credenciales
     */
    // STATUS: Implementación completa (token validation + user creation/activation).
    describe('AcceptInvitationUseCase', () => {
        let useCase: AcceptInvitationUseCase;
        let invitationsRepository: any;
        let invitationPolicy: any;
        let hashService: any;
        let userRepository: any;
        let passwordHasher: any;
        let tokenService: any;

        beforeEach(() => {
            invitationsRepository = {
                findByToken: jest.fn(),
                save: jest.fn(),
            };
            invitationPolicy = {
                isAllowedDomain: jest.fn(),
            };
            hashService = {
                hash: jest.fn((token: string) => `hashed-${token}`),
            };
            userRepository = {
                findByCorreo: jest.fn(),
                save: jest
                    .fn()
                    .mockImplementation((u: any) =>
                        Promise.resolve({ ...u, id: u.id ?? 1 }),
                    ),
            };
            passwordHasher = {
                hash: jest.fn().mockResolvedValue('hashed-password-123'),
            };
            tokenService = {
                signAccessToken: jest.fn().mockResolvedValue('access-token'),
                signRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
            };

            useCase = new AcceptInvitationUseCase(
                invitationsRepository,
                invitationPolicy,
                hashService,
                userRepository,
                passwordHasher,
                tokenService,
            );
        });

        it('should accept valid invitation and create user', async () => {
            const invitation = new InvitationToken(
                1,
                'newuser@bioactiva.com',
                'hashed-token',
                UserRole.TRABAJADOR,
                1,
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            );

            invitationsRepository.findByToken.mockResolvedValue(invitation);
            userRepository.findByCorreo.mockResolvedValue(null);
            invitationPolicy.isAllowedDomain.mockReturnValue(true);
            invitationsRepository.save.mockResolvedValue(invitation);

            await useCase.execute('raw-token', 'password123', 'Juan', 'Perez');

            expect(invitationsRepository.findByToken).toHaveBeenCalled();
            expect(userRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    nombres: 'Juan',
                    apellidos: 'Perez',
                    correo: 'newuser@bioactiva.com',
                    estado: UserState.ACTIVO,
                    role: UserRole.TRABAJADOR,
                }),
            );
        });

        it('should reject with invalid token', async () => {
            invitationsRepository.findByToken.mockResolvedValue(null);

            await expect(
                useCase.execute(
                    'invalid-token',
                    'password123',
                    'Juan',
                    'Perez',
                ),
            ).rejects.toThrow(InvalidInvitationTokenException);
        });

        it('should reject if invitation is expired', async () => {
            const expiredInvitation = new InvitationToken(
                1,
                'newuser@bioactiva.com',
                'hashed-token',
                UserRole.TRABAJADOR,
                1,
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() - 1000),
            );

            invitationsRepository.findByToken.mockResolvedValue(
                expiredInvitation,
            );

            await expect(
                useCase.execute('raw-token', 'password123', 'Juan', 'Perez'),
            ).rejects.toThrow(InvitationExpiredException);
        });

        it('should reject if invitation already accepted', async () => {
            const acceptedInvitation = new InvitationToken(
                1,
                'newuser@bioactiva.com',
                'hashed-token',
                UserRole.TRABAJADOR,
                1,
                TokenStatus.CONSUMIDO,
                new Date(),
                new Date(),
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // FIX: future date so isExpired() doesn't fire first
            );

            invitationsRepository.findByToken.mockResolvedValue(
                acceptedInvitation,
            );

            await expect(
                useCase.execute('raw-token', 'password123', 'Juan', 'Perez'),
            ).rejects.toThrow(InvitationAlreadyAcceptedException);
        });

        it('should reject if domain is not allowed', async () => {
            const invitation = new InvitationToken(
                1,
                'newuser@bioactiva.com',
                'hashed-token',
                UserRole.TRABAJADOR,
                1,
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            );

            invitationsRepository.findByToken.mockResolvedValue(invitation);
            invitationPolicy.isAllowedDomain.mockReturnValue(false);

            await expect(
                useCase.execute('raw-token', 'password123', 'Juan', 'Perez'),
            ).rejects.toThrow(InvalidInvitationDomainException);
        });

        it('should reject if active user already exists with email', async () => {
            const invitation = new InvitationToken(
                1,
                'newuser@bioactiva.com',
                'hashed-token',
                UserRole.TRABAJADOR,
                1,
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            );

            const existingUser = new User(
                5,
                'Existing',
                'User',
                'newuser@bioactiva.com',
                'password',
                new Date(),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date(),
            );

            invitationsRepository.findByToken.mockResolvedValue(invitation);
            userRepository.findByCorreo.mockResolvedValue(existingUser);

            await expect(
                useCase.execute('raw-token', 'password123', 'Juan', 'Perez'),
            ).rejects.toThrow(InvalidInvitationDomainException);
        });

        it('should hash password when creating user', async () => {
            const invitation = new InvitationToken(
                1,
                'newuser@bioactiva.com',
                'hashed-token',
                UserRole.TRABAJADOR,
                1,
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            );

            invitationsRepository.findByToken.mockResolvedValue(invitation);
            userRepository.findByCorreo.mockResolvedValue(null);
            invitationPolicy.isAllowedDomain.mockReturnValue(true);
            invitationsRepository.save.mockResolvedValue(invitation);

            await useCase.execute(
                'raw-token',
                'plainpassword',
                'Juan',
                'Perez',
            );

            expect(passwordHasher.hash).toHaveBeenCalledWith('plainpassword');
        });
    });

    /**
     * RevokeInvitationUseCase
     * ----------
     * Responsable de:
     * - revocar invitaciones pendientes
     */
    // STATUS: Implementación completa (revoke logic).
    describe('RevokeInvitationUseCase', () => {
        let useCase: RevokeInvitationUseCase;
        let invitationsRepository: any;

        beforeEach(() => {
            invitationsRepository = {
                findById: jest.fn(),
                save: jest.fn(),
            };

            useCase = new RevokeInvitationUseCase(invitationsRepository);
        });

        it('should revoke pending invitation', async () => {
            const invitation = new InvitationToken(
                1,
                'user@bioactiva.com',
                'token',
                UserRole.TRABAJADOR,
                1,
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            );

            invitationsRepository.findById.mockResolvedValue(invitation);
            invitationsRepository.save.mockResolvedValue({
                ...invitation,
                estado: TokenStatus.EXPIRADO,
            });

            const result = await useCase.execute(1);

            expect(result.estado).toBe(TokenStatus.EXPIRADO);
        });

        it('should throw if invitation not found', async () => {
            invitationsRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(999)).rejects.toThrow(
                'Invitación no encontrada',
            );
        });
    });

    /**
     * ExpireInvitationUseCase
     * ----------
     * Responsable de:
     * - expirar invitaciones pendientes automáticamente
     */
    // STATUS: Implementación completa (auto-expiration logic).
    describe('ExpireInvitationUseCase', () => {
        let useCase: ExpireInvitationUseCase;
        let invitationsRepository: any;

        beforeEach(() => {
            invitationsRepository = {
                findById: jest.fn(),
                save: jest.fn(),
            };

            useCase = new ExpireInvitationUseCase(invitationsRepository);
        });

        it('should expire pending invitation', async () => {
            const invitation = new InvitationToken(
                1,
                'user@bioactiva.com',
                'token',
                UserRole.TRABAJADOR,
                1,
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            );

            invitationsRepository.findById.mockResolvedValue(invitation);
            invitationsRepository.save.mockResolvedValue({
                ...invitation,
                estado: TokenStatus.EXPIRADO,
            });

            const result = await useCase.execute(1);

            expect(result).toBe(true);
        });

        it('should return false if invitation not found', async () => {
            invitationsRepository.findById.mockResolvedValue(null);

            const result = await useCase.execute(999);

            expect(result).toBe(false);
        });

        it('should return false if invitation not pending', async () => {
            const consumedInvitation = new InvitationToken(
                1,
                'user@bioactiva.com',
                'token',
                UserRole.TRABAJADOR,
                1,
                TokenStatus.CONSUMIDO,
                new Date(),
                new Date(),
                new Date(),
            );

            invitationsRepository.findById.mockResolvedValue(
                consumedInvitation,
            );

            const result = await useCase.execute(1);

            expect(result).toBe(false);
        });
    });
});
