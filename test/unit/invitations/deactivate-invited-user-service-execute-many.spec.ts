import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { DeactivateInvitedUserService } from '@/modules/invitations/application/services/deactivate-invited-user.service';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('Invitations module', () => {
    /**
     * DeactivateInvitedUserService.executeMany
     * ----------
     * Versión por lotes: resuelve todos los correos con una sola consulta y
     * desactiva solo las cuentas provisionales aún no suspendidas. Idempotente.
     */
    describe('DeactivateInvitedUserService (executeMany)', () => {
        let service: DeactivateInvitedUserService;
        let userRepository: any;

        const buildUser = (estado: UserState, password: string, correo: string) =>
            new User(
                3,
                'Nombre',
                'Apellido',
                correo,
                password,
                new Date(),
                UserRole.TRABAJADOR,
                estado,
                new Date(),
            );

        beforeEach(() => {
            userRepository = {
                findByCorreo: jest.fn(() => Promise.resolve(null)),
                findByCorreos: jest.fn(() => Promise.resolve([])),
                save: jest.fn(() => Promise.resolve()),
            };
            service = new DeactivateInvitedUserService(userRepository);
        });

        it('should do nothing when the list of correos is empty', async () => {
            await service.executeMany([]);

            expect(userRepository.findByCorreos).not.toHaveBeenCalled();
            expect(userRepository.save).not.toHaveBeenCalled();
        });

        it('should deactivate only provisional, not-suspended users in a single batch query', async () => {
            const provisional = buildUser(
                UserState.PENDIENTE,
                '',
                'pending@bioactiva.com',
            );
            const registered = buildUser(
                UserState.ACTIVO,
                'hashed-password',
                'active@bioactiva.com',
            );
            const suspended = buildUser(
                UserState.SUSPENDIDO,
                '',
                'suspended@bioactiva.com',
            );
            userRepository.findByCorreos.mockResolvedValue([
                provisional,
                registered,
                suspended,
            ]);

            await service.executeMany([
                'pending@bioactiva.com',
                'active@bioactiva.com',
                'suspended@bioactiva.com',
            ]);

            expect(userRepository.findByCorreos).toHaveBeenCalledTimes(1);
            expect(userRepository.findByCorreos).toHaveBeenCalledWith([
                'pending@bioactiva.com',
                'active@bioactiva.com',
                'suspended@bioactiva.com',
            ]);
            // Solo el provisional pendiente debe persistirse desactivado.
            expect(userRepository.save).toHaveBeenCalledTimes(1);
            expect(userRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ estado: UserState.SUSPENDIDO }),
            );
            expect(provisional.estado).toBe(UserState.SUSPENDIDO);
        });

        it('should not save anyone when no provisional users are returned', async () => {
            userRepository.findByCorreos.mockResolvedValue([
                buildUser(UserState.ACTIVO, 'hashed-password', 'a@bioactiva.com'),
                buildUser(UserState.SUSPENDIDO, '', 'b@bioactiva.com'),
            ]);

            await service.executeMany(['a@bioactiva.com', 'b@bioactiva.com']);

            expect(userRepository.save).not.toHaveBeenCalled();
        });
    });
});
