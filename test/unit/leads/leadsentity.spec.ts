import { describe, expect, it } from '@jest/globals';

import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';

describe('Leads module', () => {
	/**
	 * Lead entity
	 * ----------
	 * Responsable de:
	 * - cambiar estado del lead en el pipeline
	 * - asignar responsable del lead
	 * - vincular/desvinular contacto con lead
	 * - mantener trazabilidad de cambios
	 */
	// STATUS: Implementación completa (métodos de dominio y reglas de asignación).
	describe('Lead entity domain rules', () => {
		const createdAt = new Date('2024-01-01T00:00:00.000Z');

		const buildLead = () =>
			new Lead(
				1,
				'org-1',
				5,
				LeadState.EN_PROSPECTO,
				'Desarrollo de sitio web',
				'Cliente interesado en soluciones custom',
				'Necesita migrar de plataforma antigua',
				'Contacto activo y comprometido',
				1,
				'LinkedIn',
				1,
				createdAt,
				createdAt,
			);

		it('should change lead state and update timestamp', () => {
			const lead = buildLead();
			const oldUpdatedAt = lead.updated_at;

			lead.changeState(LeadState.OFERTADO);

			expect(lead.estado).toBe(LeadState.OFERTADO);
			expect(lead.updated_at.getTime()).toBeGreaterThan(
				oldUpdatedAt.getTime(),
			);
		});

		it('should allow transitioning through different states', () => {
			const lead = buildLead();

			lead.changeState(LeadState.OFERTADO);
			expect(lead.estado).toBe(LeadState.OFERTADO);

			lead.changeState(LeadState.CIERRE_CON_VENTA);
			expect(lead.estado).toBe(LeadState.CIERRE_CON_VENTA);

			lead.changeState(LeadState.EN_PROSPECTO);
			expect(lead.estado).toBe(LeadState.EN_PROSPECTO);
		});

		it('should assign new responsible user', () => {
			const lead = buildLead();
			const oldUpdatedAt = lead.updated_at;
			const newResponsibleId = 5;

			lead.assignResponsible(newResponsibleId);

			expect(lead.id_encargado).toBe(newResponsibleId);
			expect(lead.updated_at.getTime()).toBeGreaterThan(
				oldUpdatedAt.getTime(),
			);
		});

		it('should throw error when assigning same responsible', () => {
			const lead = buildLead();
			const currentResponsibleId = lead.id_encargado;
			const updatedAtBeforeError = lead.updated_at;

			expect(() =>
				lead.assignResponsible(currentResponsibleId),
			).toThrow('El encargado ya está asignado');
			expect(lead.id_encargado).toBe(currentResponsibleId); // Unchanged
			expect(lead.updated_at).toEqual(updatedAtBeforeError); // Timestamp unchanged
		});

		it('should allow reassigning to different responsible after clear', () => {
			const lead = buildLead();
			lead.assignResponsible(5);
			lead.assignResponsible(10); // Different ID should work

			expect(lead.id_encargado).toBe(10);
		});

		it('should attach contact to lead', () => {
			const lead = buildLead();
			const oldUpdatedAt = lead.updated_at;

			lead.attachContact(42);

			expect(lead.id_contacto).toBe(42);
			expect(lead.updated_at.getTime()).toBeGreaterThan(
				oldUpdatedAt.getTime(),
			);
		});

		it('should allow detaching contact by setting to null', () => {
			const lead = buildLead();
			lead.attachContact(42);
			const updatedAtAfterAttach = lead.updated_at;

			lead.attachContact(null);

			expect(lead.id_contacto).toBeNull();
			expect(lead.updated_at.getTime()).toBeGreaterThanOrEqual(
				updatedAtAfterAttach.getTime(),
			);
		});

		it('should allow attaching different contact', () => {
			const lead = buildLead();
			lead.attachContact(42);
			lead.attachContact(99);

			expect(lead.id_contacto).toBe(99);
		});

		it('should preserve other lead properties during state changes', () => {
			const lead = buildLead();
			const originalOrg = lead.id_org;
			const originalResponsible = lead.id_encargado;

			lead.changeState(LeadState.CIERRE_CON_VENTA);

			expect(lead.id_org).toBe(originalOrg);
			expect(lead.id_encargado).toBe(originalResponsible);
		});

		it('should allow multiple state changes and assignments', () => {
			const lead = buildLead();

			lead.changeState(LeadState.OFERTADO);
			lead.assignResponsible(5);
			lead.attachContact(10);
			lead.changeState(LeadState.CIERRE_CON_VENTA);
			lead.assignResponsible(7);

			expect(lead.estado).toBe(LeadState.CIERRE_CON_VENTA);
			expect(lead.id_encargado).toBe(7);
			expect(lead.id_contacto).toBe(10);
		});
	});
});
