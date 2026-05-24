import { describe, expect, it } from '@jest/globals';

import { Organizacion } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { Size } from '@/modules/organizations/domain/enums/size';

describe('Organizations module', () => {
	/**
	 * Organizacion entity
	 * ----------
	 * Responsable de:
	 * - renombrar la organización
	 * - actualizar nombre comercial
	 * - seleccionar contacto activo
	 * - limpiar contacto activo
	 * - mantener integridad de timestamps
	 */
	// STATUS: Implementación completa (métodos de dominio y reglas de negocio).
	describe('Organizacion entity domain rules', () => {
		const createdAt = new Date('2024-01-01T00:00:00.000Z');

		const buildOrganizacion = () =>
			new Organizacion(
				'org-1',
				'CLI-001',
				'TechCorp SA',
				'TechCorp',
				'IT',
				'12345678',
				EnterpriseType.EMPRESA,
				'https://linkedin.com/company/techcorp',
				'Lima, Perú',
				Sector.TECNOLOGIA,
				Size.GRANDE,
				'Desarrollo de software',
				'Partner de Google Cloud',
				null,
				createdAt,
				createdAt,
				1,
			);

		it('should rename organization with valid name', () => {
			const org = buildOrganizacion();
			const newName = 'TechCorp Global';

			org.rename(newName);

			expect(org.nombre).toBe('TechCorp Global');
			expect(org.updated_at).not.toEqual(createdAt);
		});

		it('should throw error when renaming to empty string', () => {
			const org = buildOrganizacion();

			expect(() => org.rename('')).toThrow(
				'El nombre no puede estar vacío',
			);
			expect(org.nombre).toBe('TechCorp SA'); // Original name unchanged
		});

		it('should throw error when renaming to whitespace only', () => {
			const org = buildOrganizacion();

			expect(() => org.rename('   ')).toThrow(
				'El nombre no puede estar vacío',
			);
		});

		it('should update commercial name and timestamp', () => {
			const org = buildOrganizacion();
			const oldUpdatedAt = org.updated_at;
			const newCommercialName = 'TechCorp Latam';

			org.updateCommercialName(newCommercialName);

			expect(org.nombre_comercial).toBe('TechCorp Latam');
			expect(org.updated_at.getTime()).toBeGreaterThan(
				oldUpdatedAt.getTime(),
			);
		});

		it('should select new contact and update timestamp', () => {
			const org = buildOrganizacion();
			const oldUpdatedAt = org.updated_at;
			const contactId = 42;

			org.selectContact(contactId);

			expect(org.id_contacto_activo).toBe(contactId);
			expect(org.updated_at.getTime()).toBeGreaterThan(
				oldUpdatedAt.getTime(),
			);
		});

		it('should throw error when selecting already selected contact', () => {
			const org = buildOrganizacion();
			const contactId = 42;

			org.selectContact(contactId);
			const updatedAtAfterFirstSelect = org.updated_at;

			expect(() => org.selectContact(contactId)).toThrow(
				'El contacto ya está seleccionado',
			);
			expect(org.id_contacto_activo).toBe(contactId); // Still selected
			expect(org.updated_at).toEqual(updatedAtAfterFirstSelect); // Timestamp unchanged
		});

		it('should clear selected contact and update timestamp', () => {
			const org = buildOrganizacion();
			org.selectContact(42); // First select a contact
			const updatedAtAfterSelect = org.updated_at;

			org.clearSelectedContact();

			expect(org.id_contacto_activo).toBeNull();
			expect(org.updated_at.getTime()).toBeGreaterThanOrEqual(
				updatedAtAfterSelect.getTime(),
			);
		});

		it('should allow clearing contact multiple times', () => {
			const org = buildOrganizacion();
			org.selectContact(42);

			org.clearSelectedContact();
			expect(org.id_contacto_activo).toBeNull();

			// Should allow clearing again without error
			const updatedAtBeforeSecondClear = org.updated_at;
			org.clearSelectedContact();
			expect(org.id_contacto_activo).toBeNull();
			expect(org.updated_at.getTime()).toBeGreaterThanOrEqual(
				updatedAtBeforeSecondClear.getTime(),
			);
		});

		it('should allow selecting different contact after clearing', () => {
			const org = buildOrganizacion();
			org.selectContact(42);
			org.clearSelectedContact();

			org.selectContact(99); // Select different contact

			expect(org.id_contacto_activo).toBe(99);
		});
	});
});
