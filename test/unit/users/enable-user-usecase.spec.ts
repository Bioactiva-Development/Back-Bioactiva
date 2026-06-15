import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { EnableUserUseCase } from '@/modules/users/application/use-cases/enable-user.use-case';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user-not-found.exception';
import { UserCannotBeRevokedException } from '@/modules/users/domain/exceptions/user-cannot-be-revoked.exception';
import { ProvisionalUserCannotBeEnabledException } from '@/modules/users/domain/exceptions/provisional-user-cannot-be-enabled.exception';

describe('Users module', () => {
    describe('EnableUserUseCase', () => {
        let useCase: EnableUserUseCase;
        let repository: any;

        const buildUser = (estado: UserState, password: string) =>
            new User(
                1,
                'Ana',
                'García',
                'ana@example.com',
                password,
                new Date(),
                UserRole.TRABAJADOR,
                estado,
                new Date(),
            );

        beforeEach(() => {
            repository = {
                findById: jest.fn(),
                save: jest.fn(async (u: User) => u),
            };
            useCase = new EnableUserUseCase(repository);
        });

        it('enables a real (registered) suspended user', async () => {
            const user = buildUser(UserState.SUSPENDIDO, 'hashed-password');
            repository.findById.mockResolvedValue(user);

            await useCase.execute(1);

            expect(user.estado).toBe(UserState.ACTIVO);
            expect(repository.save).toHaveBeenCalledWith(user);
        });

        it('throws when the user does not exist', async () => {
            repository.findById.mockResolvedValue(null);

            await expect(useCase.execute(99)).rejects.toThrow(
                UserNotFoundException,
            );
        });

        it('throws when the user is already enabled', async () => {
            repository.findById.mockResolvedValue(
                buildUser(UserState.ACTIVO, 'hashed-password'),
            );

            await expect(useCase.execute(1)).rejects.toThrow(
                UserCannotBeRevokedException,
            );
            expect(repository.save).not.toHaveBeenCalled();
        });

        it('rejects enabling a provisional user from a revoked/expired invitation', async () => {
            // Provisional = sin contraseña; quedó SUSPENDIDO al revocarse la invitación.
            repository.findById.mockResolvedValue(
                buildUser(UserState.SUSPENDIDO, ''),
            );

            await expect(useCase.execute(1)).rejects.toThrow(
                ProvisionalUserCannotBeEnabledException,
            );
            expect(repository.save).not.toHaveBeenCalled();
        });
    });
});
