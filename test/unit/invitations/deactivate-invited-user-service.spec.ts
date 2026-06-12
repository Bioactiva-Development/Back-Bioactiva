import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { DeactivateInvitedUserService } from '@/modules/invitations/application/services/deactivate-invited-user.service';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('Invitations module', () => {
    /**
     * DeactivateInvitedUserService
     * ----------
     * Desactiva al usuario provisional asociado a una invitación cancelada o
     * expirada, dejando intactas las cuentas ya registradas. Idempotente.
     */
    describe('DeactivateInvitedUserService', () => {
        let service: DeactivateInvitedUserService;
        let userRepository: any;

        const buildUser = (estado: UserState, password: string) =>
            new User(
                3,
                'Nombre',
                'Apellido',
                'invited@bioactiva.com',
                password,
                new Date(),
                UserRole.TRABAJADOR,
                estado,
                new Date(),
            );

        beforeEach(() => {
            userRepository = {
                findByCorreo: jest.fn(() => Promise.resolve(null)),
                save: jest.fn(() => Promise.resolve()),
            };
            service = new DeactivateInvitedUserService(userRepository);
        });

        it('should deactivate a provisional pending user', async () => {
            userRepository.findByCorreo.mockResolvedValue(
                buildUser(UserState.PENDIENTE, ''),
            );

            await service.execute('invited@bioactiva.com');

            expect(userRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ estado: UserState.SUSPENDIDO }),
            );
        });

        it('should do nothing when the user does not exist', async () => {
            userRepository.findByCorreo.mockResolvedValue(null);

            await service.execute('missing@bioactiva.com');

            expect(userRepository.save).not.toHaveBeenCalled();
        });

        it('should not touch a fully registered (non-provisional) user', async () => {
            userRepository.findByCorreo.mockResolvedValue(
                buildUser(UserState.ACTIVO, 'hashed-password'),
            );

            await service.execute('invited@bioactiva.com');

            expect(userRepository.save).not.toHaveBeenCalled();
        });

        it('should be idempotent when the user is already suspended', async () => {
            userRepository.findByCorreo.mockResolvedValue(
                buildUser(UserState.SUSPENDIDO, ''),
            );

            await service.execute('invited@bioactiva.com');

            expect(userRepository.save).not.toHaveBeenCalled();
        });
    });
});
