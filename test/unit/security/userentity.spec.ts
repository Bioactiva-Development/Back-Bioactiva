import { describe, expect, it } from '@jest/globals';

import { User } from '@/modules/users/domain/entities/user';
import { UserState } from '@/modules/users/domain/enums/estado';
import { UserRole } from '../../../src/shared/domain/enums/rol';

describe('Security module', () => {
	/**
	 * User entity
	 * ----------
	 * Responsable de:
	 * - validar si el usuario puede autenticarse
	 * - activar la cuenta
	 * - suspender la cuenta
	 * - actualizar contraseña
	 */
	// STATUS: Implementación parcial (reglas de estado y contraseña ya disponibles).
	describe('User entity and domain rules', () => {
		const buildUser = (state: UserState) =>
			new User(
				1,
				'Ana',
				'Paredes',
				'ana@bioactiva.com',
				'old-password',
				new Date('2024-01-01T00:00:00.000Z'),
				UserRole.TRABAJADOR,
				state,
				new Date('2024-01-02T00:00:00.000Z'),
			);

		it('should allow authentication only when the user is active', () => {
			expect(buildUser(UserState.ACTIVO).canAuthenticate()).toBe(true);
			expect(buildUser(UserState.PENDIENTE).canAuthenticate()).toBe(false);
			expect(buildUser(UserState.SUSPENDIDO).canAuthenticate()).toBe(false);
		});

		it('should activate a user that is not active', () => {
			const user = buildUser(UserState.PENDIENTE);

			user.activate();

			expect(user.estado).toBe(UserState.ACTIVO);
		});

		it('should reject activating a user that is already active', () => {
			const user = buildUser(UserState.ACTIVO);

			expect(() => user.activate()).toThrow('El usuario ya está activo');
		});

		it('should suspend a user that is not already suspended', () => {
			const user = buildUser(UserState.ACTIVO);

			user.deactivate();

			expect(user.estado).toBe(UserState.SUSPENDIDO);
		});

		it('should reject suspending a user that is already suspended', () => {
			const user = buildUser(UserState.SUSPENDIDO);

			expect(() => user.deactivate()).toThrow('El usuario ya está suspendido');
		});

		it('should update the password and refresh the updated timestamp', () => {
			const user = buildUser(UserState.ACTIVO);
			const previousUpdatedAt = user.updated_at;

			user.updatePassword('new-password');

			expect(user.password).toBe('new-password');
			expect(user.updated_at).not.toBe(previousUpdatedAt);
		});

		it('should reject empty passwords', () => {
			const user = buildUser(UserState.ACTIVO);

			expect(() => user.updatePassword('   ')).toThrow(
				'La contraseña no puede estar vacía',
			);
		});
	});
});
