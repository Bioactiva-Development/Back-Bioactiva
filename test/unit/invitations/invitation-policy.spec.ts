import { describe, expect, it, beforeEach } from '@jest/globals';
import { InvitationPolicyService } from '@/modules/invitations/infrastructure/service/invitation-policy.service';
import { AllowedEmailDomainsConfig } from '@/shared/infrastructure/config/allowed-email-domains.config';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('Invitations module', () => {
	/**
	 * InvitationPolicyService
	 * ----------
	 * Responsable de:
	 * - validar dominios de correo permitidos
	 * - validar roles permitidos para invitaciones
	 * - validar permisos de creación
	 */
	// STATUS: Implementación completa (domain + role + creation policies).
	describe('InvitationPolicyService', () => {
		let service: InvitationPolicyService;
		let configMock: AllowedEmailDomainsConfig;

		beforeEach(() => {
			configMock = {
				getAllowedDomains: () => ['bioactiva.com', 'empresa.pe', 'test.local'],
			} as unknown as AllowedEmailDomainsConfig;

			service = new InvitationPolicyService(configMock);
		});

		describe('isAllowedDomain', () => {
			it('should return true for allowed domain', () => {
				const result = service.isAllowedDomain('user@bioactiva.com');

				expect(result).toBe(true);
			});

			it('should return true for other allowed domain', () => {
				const result = service.isAllowedDomain('admin@empresa.pe');

				expect(result).toBe(true);
			});

			it('should return false for disallowed domain', () => {
				const result = service.isAllowedDomain('user@gmail.com');

				expect(result).toBe(false);
			});

			it('should be case-insensitive for domain check', () => {
				const result = service.isAllowedDomain('user@BIOACTIVA.COM');

				expect(result).toBe(true);
			});

			it('should handle email without domain', () => {
				const result = service.isAllowedDomain('nodomain');

				expect(result).toBe(false);
			});

			it('should handle empty domain part', () => {
				const result = service.isAllowedDomain('user@');

				expect(result).toBe(false);
			});

			it('should handle email with multiple @ symbols', () => {
				const result = service.isAllowedDomain('user@@bioactiva.com');

				expect(result).toBe(false);
			});
		});

		describe('isAllowedRole', () => {
			it('should return true for ADMINISTRADOR role', () => {
				const result = service.isAllowedRole(UserRole.ADMINISTRADOR);

				expect(result).toBe(true);
			});

			it('should return true for TRABAJADOR role', () => {
				const result = service.isAllowedRole(UserRole.TRABAJADOR);

				expect(result).toBe(true);
			});

			it('should allow both admin and worker roles', () => {
				expect(service.isAllowedRole(UserRole.ADMINISTRADOR)).toBe(true);
				expect(service.isAllowedRole(UserRole.TRABAJADOR)).toBe(true);
			});
		});

		describe('canCreateInvitation', () => {
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

			const buildInactiveAdmin = () =>
				new User(
					3,
					'Inactive',
					'Admin',
					'inactive@bioactiva.com',
					'hashed-password',
					new Date(),
					UserRole.ADMINISTRADOR,
					UserState.PENDIENTE,
					new Date(),
				);

			it('should allow active admin to create invitation', () => {
				const admin = buildAdmin();

				const result = service.canCreateInvitation(admin);

				expect(result).toBe(true);
			});

			it('should not allow worker to create invitation', () => {
				const worker = buildWorker();

				const result = service.canCreateInvitation(worker);

				expect(result).toBe(false);
			});

			it('should not allow inactive admin to create invitation', () => {
				const inactiveAdmin = buildInactiveAdmin();

				const result = service.canCreateInvitation(inactiveAdmin);

				expect(result).toBe(false);
			});

			it('should check authentication status of user', () => {
				const admin = buildAdmin();
				expect(admin.canAuthenticate()).toBe(true);
				expect(service.canCreateInvitation(admin)).toBe(true);

				const inactiveAdmin = buildInactiveAdmin();
				expect(inactiveAdmin.canAuthenticate()).toBe(false);
				expect(service.canCreateInvitation(inactiveAdmin)).toBe(false);
			});

			it('should require both admin role AND active state', () => {
				const admin = buildAdmin();
				admin.estado = UserState.SUSPENDIDO;

				const result = service.canCreateInvitation(admin);

				expect(result).toBe(false);
			});
		});

		describe('integrated policy checks', () => {
			it('should validate complete invitation creation scenario', () => {
				const admin = new User(
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

				const canCreate = service.canCreateInvitation(admin);
				const isAllowedRole = service.isAllowedRole(UserRole.TRABAJADOR);
				const isAllowedDomain = service.isAllowedDomain('newuser@bioactiva.com');

				expect(canCreate).toBe(true);
				expect(isAllowedRole).toBe(true);
				expect(isAllowedDomain).toBe(true);
			});

			it('should reject invitation from non-admin', () => {
				const worker = new User(
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

				const canCreate = service.canCreateInvitation(worker);

				expect(canCreate).toBe(false);
			});

			it('should reject invitation to disallowed domain', () => {
				const admin = new User(
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

				const canCreate = service.canCreateInvitation(admin);
				const isAllowedDomain = service.isAllowedDomain('user@gmail.com');

				expect(canCreate).toBe(true);
				expect(isAllowedDomain).toBe(false);
			});
		});

		describe('edge cases', () => {
			it('should handle very long email addresses', () => {
				const longEmail =
					'verylongemailusernamethathasmanychars@bioactiva.com';
				const result = service.isAllowedDomain(longEmail);

				expect(result).toBe(true);
			});

			it('should handle subdomain emails', () => {
				const subdomainEmail = 'user@subdomain.bioactiva.com';
				const result = service.isAllowedDomain(subdomainEmail);

				expect(result).toBe(false);
			});

			it('should handle domain with different case', () => {
				const mixedCaseEmail = 'user@BiOaCtIvA.cOm';
				const result = service.isAllowedDomain(mixedCaseEmail);

				expect(result).toBe(true);
			});
		});
	});
});
