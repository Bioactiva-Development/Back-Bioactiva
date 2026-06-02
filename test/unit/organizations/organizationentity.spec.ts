import { describe, expect, it } from '@jest/globals';

import { Organization } from '@/modules/organizations/domain/entities/organization';
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
            new Organization(
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
                1,
                createdAt,
                createdAt,
            );

        it('should rename organization with valid name', () => {
            const org = buildOrganizacion();
            const newName = 'TechCorp Global';

            org.rename(newName);

            expect(org.nombre).toBe('TechCorp Global');
            expect(org.updatedAt).not.toEqual(createdAt);
        });

        it('should throw error when renaming to empty string', () => {
            const org = buildOrganizacion();

            expect(() => org.rename('')).toThrow(
                'El nombre de la organización (Razón Social) no puede estar vacío',
            );
            expect(org.nombre).toBe('TechCorp SA'); // Original name unchanged
        });

        it('should throw error when renaming to whitespace only', () => {
            const org = buildOrganizacion();

            expect(() => org.rename('   ')).toThrow(
                'El nombre de la organización (Razón Social) no puede estar vacío',
            );
        });

        it('should update commercial name and timestamp', () => {
            const org = buildOrganizacion();
            const oldUpdatedAt = org.updatedAt;
            const newCommercialName = 'TechCorp Latam';

            org.updateCommercialName(newCommercialName);

            expect(org.nombreComercial).toBe('TechCorp Latam');
            expect(org.updatedAt.getTime()).toBeGreaterThan(
                oldUpdatedAt.getTime(),
            );
        });

        it('should throw error when updating commercial name to empty', () => {
            const org = buildOrganizacion();

            expect(() => org.updateCommercialName('')).toThrow(
                'El nombre comercial no puede estar vacío',
            );
            expect(org.nombreComercial).toBe('TechCorp');
        });

        it('should throw error when updating commercial name to whitespace', () => {
            const org = buildOrganizacion();

            expect(() => org.updateCommercialName('   ')).toThrow(
                'El nombre comercial no puede estar vacío',
            );
        });

        it('should select new contact and update timestamp', () => {
            const org = buildOrganizacion();
            const oldUpdatedAt = org.updatedAt;
            const contactId = 42;

            org.selectContact(contactId);

            expect(org.idContactoActivo).toBe(contactId);
            expect(org.updatedAt.getTime()).toBeGreaterThan(
                oldUpdatedAt.getTime(),
            );
        });

        it('should throw error when selecting already selected contact', () => {
            const org = buildOrganizacion();
            const contactId = 42;

            org.selectContact(contactId);
            const updatedAtAfterFirstSelect = org.updatedAt;

            expect(() => org.selectContact(contactId)).toThrow(
                'El contacto ya está seleccionado como activo',
            );
            expect(org.idContactoActivo).toBe(contactId); // Still selected
            expect(org.updatedAt).toEqual(updatedAtAfterFirstSelect); // Timestamp unchanged
        });

        it('should clear selected contact and update timestamp', () => {
            const org = buildOrganizacion();
            org.selectContact(42); // First select a contact
            const updatedAtAfterSelect = org.updatedAt;

            org.clearSelectedContact();

            expect(org.idContactoActivo).toBeNull();
            expect(org.updatedAt.getTime()).toBeGreaterThanOrEqual(
                updatedAtAfterSelect.getTime(),
            );
        });

        it('should allow clearing contact multiple times', () => {
            const org = buildOrganizacion();
            org.selectContact(42);

            org.clearSelectedContact();
            expect(org.idContactoActivo).toBeNull();

            // Should allow clearing again without error
            const updatedAtBeforeSecondClear = org.updatedAt;
            org.clearSelectedContact();
            expect(org.idContactoActivo).toBeNull();
            expect(org.updatedAt.getTime()).toBeGreaterThanOrEqual(
                updatedAtBeforeSecondClear.getTime(),
            );
        });

        it('should allow selecting different contact after clearing', () => {
            const org = buildOrganizacion();
            org.selectContact(42);
            org.clearSelectedContact();

            org.selectContact(99); // Select different contact

            expect(org.idContactoActivo).toBe(99);
        });
    });
});
