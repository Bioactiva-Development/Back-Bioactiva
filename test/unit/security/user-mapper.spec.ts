import { describe, expect, it } from '@jest/globals';
import { UserMapper } from '@/modules/users/infrastructure/mappers/user.mapper';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('Security module', () => {
	/**
	 * UserMapper
	 * ----------
	 * Responsable de:
	 * - mapear roles de Prisma a dominio (ADMINISTRADOR/TRABAJADOR)
	 * - mapear estados de usuario de Prisma a dominio (PENDIENTE/ACTIVO/SUSPENDIDO)
	 * - convertir entidades de dominio a formato Prisma
	 * - mantener bidireccionalidad en las conversiones
	 */
	// STATUS: Implementación completa (todos los mapeos role y state).
	describe('UserMapper', () => {
		describe('mapRole', () => {
			it('should map ADMINISTRADOR from Prisma', () => {
				const result = UserMapper.mapRole('ADMINISTRADOR' as any);
				expect(result).toBe(UserRole.ADMINISTRADOR);
			});

			it('should map TRABAJADOR from Prisma', () => {
				const result = UserMapper.mapRole('TRABAJADOR' as any);
				expect(result).toBe(UserRole.TRABAJADOR);
			});
		});

		describe('mapState', () => {
			it('should map PENDIENTE from Prisma', () => {
				const result = UserMapper.mapState('PENDIENTE' as any);
				expect(result).toBe(UserState.PENDIENTE);
			});

			it('should map ACTIVO from Prisma', () => {
				const result = UserMapper.mapState('ACTIVO' as any);
				expect(result).toBe(UserState.ACTIVO);
			});

			it('should map SUSPENDIDO from Prisma', () => {
				const result = UserMapper.mapState('SUSPENDIDO' as any);
				expect(result).toBe(UserState.SUSPENDIDO);
			});
		});

		describe('mapRoleToPrisma', () => {
			it('should map UserRole.ADMINISTRADOR to Prisma', () => {
				const result = UserMapper.mapRoleToPrisma(UserRole.ADMINISTRADOR);
				expect(result).toBe('ADMINISTRADOR');
			});

			it('should map UserRole.TRABAJADOR to Prisma', () => {
				const result = UserMapper.mapRoleToPrisma(UserRole.TRABAJADOR);
				expect(result).toBe('TRABAJADOR');
			});
		});

		describe('mapStateToPrisma', () => {
			it('should map UserState.PENDIENTE to Prisma', () => {
				const result = UserMapper.mapStateToPrisma(UserState.PENDIENTE);
				expect(result).toBe('PENDIENTE');
			});

			it('should map UserState.ACTIVO to Prisma', () => {
				const result = UserMapper.mapStateToPrisma(UserState.ACTIVO);
				expect(result).toBe('ACTIVO');
			});

			it('should map UserState.SUSPENDIDO to Prisma', () => {
				const result = UserMapper.mapStateToPrisma(UserState.SUSPENDIDO);
				expect(result).toBe('SUSPENDIDO');
			});
		});

		describe('bidirectional conversion', () => {
			it('should preserve role through round-trip conversion', () => {
				const original = UserRole.ADMINISTRADOR;
				const toPrisma = UserMapper.mapRoleToPrisma(original);
				const backToRole = UserMapper.mapRole(toPrisma as any);
				expect(backToRole).toBe(original);
			});

			it('should preserve state through round-trip conversion', () => {
				const original = UserState.ACTIVO;
				const toPrisma = UserMapper.mapStateToPrisma(original);
				const backToState = UserMapper.mapState(toPrisma as any);
				expect(backToState).toBe(original);
			});
		});
	});
});
