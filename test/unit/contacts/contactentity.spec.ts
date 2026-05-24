import { describe, expect, it } from '@jest/globals';

import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';

describe('Contacts module', () => {
	/**
	 * Contact entity
	 * ----------
	 * Responsable de:
	 * - cambiar email del contacto
	 * - marcar email como vencido
	 * - mantener integridad de datos de contacto
	 * - actualizar timestamps en cambios
	 */
	// STATUS: Implementación completa (métodos de dominio y validaciones).
	describe('Contact entity domain rules', () => {
		const createdAt = new Date('2024-01-01T00:00:00.000Z');

		const buildContact = () =>
			new Contact(
				1,
				'Ana',
				'Paredes',
				Vocative.DOCTORA,
				'Gerente Comercial',
				'ana.paredes@techcorp.com',
				'+51987654321',
				'ana.p@personal.com',
				'Primera contacto en Linkedin',
				'org-1',
				1,
				createdAt,
				createdAt,
				EstadoCorreo.VIGENTE,
			);

		it('should change email to valid address', () => {
			const contact = buildContact();
			const newEmail = 'ana.new@techcorp.com';

			contact.changeEmail(newEmail);

			expect(contact.correo).toBe(newEmail);
			expect(contact.updated_at).not.toEqual(createdAt);
		});

		it('should throw error when changing email to empty string', () => {
			const contact = buildContact();

			expect(() => contact.changeEmail('')).toThrow(
				'El correo no puede estar vacío',
			);
			expect(contact.correo).toBe('ana.paredes@techcorp.com'); // Original email unchanged
		});

		it('should throw error when changing email to whitespace only', () => {
			const contact = buildContact();

			expect(() => contact.changeEmail('   ')).toThrow(
				'El correo no puede estar vacío',
			);
		});

		it('should mark email as expired', () => {
			const contact = buildContact();
			const oldUpdatedAt = contact.updated_at;

			contact.markExpired();

			expect(contact.estado_correo).toBe(EstadoCorreo.VENCIDO);
			expect(contact.updated_at.getTime()).toBeGreaterThan(
				oldUpdatedAt.getTime(),
			);
		});

		it('should allow marking email as expired multiple times', () => {
			const contact = buildContact();
			contact.markExpired();
			const firstExpiredAt = contact.updated_at;

			// Mark expired again
			contact.markExpired();

			expect(contact.estado_correo).toBe(EstadoCorreo.VENCIDO);
			expect(contact.updated_at.getTime()).toBeGreaterThanOrEqual(
				firstExpiredAt.getTime(),
			);
		});

		it('should accept special characters and formats in email', () => {
			const contact = buildContact();
			const specialEmail = 'ana.paredes+tag@example.co.uk';

			contact.changeEmail(specialEmail);

			expect(contact.correo).toBe(specialEmail);
		});

		it('should maintain other contact properties when changing email', () => {
			const contact = buildContact();
			const originalNombres = contact.nombres;
			const originalCargo = contact.cargo;

			contact.changeEmail('new.email@techcorp.com');

			expect(contact.nombres).toBe(originalNombres);
			expect(contact.cargo).toBe(originalCargo);
		});
	});
});
