import { describe, expect, it } from '@jest/globals';

import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { InvalidLeadResponsibleException } from '@/modules/leads/domain/exceptions/invalid-lead-responsible.exception';

describe('Leads module', () => {
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
                null,
                createdAt,
            );

        it('should change lead state and update timestamps', () => {
            const lead = buildLead();
            const oldUpdatedAt = lead.updated_at;
            const oldUltimoCambio = lead.ultimo_cambio;

            lead.changeState(LeadState.OFERTADO);

            expect(lead.estado).toBe(LeadState.OFERTADO);
            expect(lead.updated_at.getTime()).toBeGreaterThan(
                oldUpdatedAt.getTime(),
            );
            expect(lead.ultimo_cambio.getTime()).toBeGreaterThan(
                oldUltimoCambio.getTime(),
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

        it('should stamp fecha_cierre when closing with sale', () => {
            const lead = buildLead();
            expect(lead.fecha_cierre).toBeNull();

            lead.changeState(LeadState.CIERRE_CON_VENTA);

            expect(lead.fecha_cierre).toBeInstanceOf(Date);
        });

        it('should clear fecha_cierre when leaving CIERRE_CON_VENTA', () => {
            const lead = buildLead();
            lead.changeState(LeadState.CIERRE_CON_VENTA);
            expect(lead.fecha_cierre).toBeInstanceOf(Date);

            lead.changeState(LeadState.EN_PROSPECTO);

            expect(lead.fecha_cierre).toBeNull();
        });

        it('should not stamp fecha_cierre on non-closing transitions', () => {
            const lead = buildLead();

            lead.changeState(LeadState.OFERTADO);

            expect(lead.fecha_cierre).toBeNull();
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

            expect(() => lead.assignResponsible(currentResponsibleId)).toThrow(
                InvalidLeadResponsibleException,
            );
            expect(lead.id_encargado).toBe(currentResponsibleId);
            expect(lead.updated_at).toEqual(updatedAtBeforeError);
        });

        it('should allow reassigning to different responsible after clear', () => {
            const lead = buildLead();
            lead.assignResponsible(5);
            lead.assignResponsible(10);

            expect(lead.id_encargado).toBe(10);
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
            lead.changeState(LeadState.CIERRE_CON_VENTA);
            lead.assignResponsible(7);

            expect(lead.estado).toBe(LeadState.CIERRE_CON_VENTA);
            expect(lead.id_encargado).toBe(7);
        });

        describe('markAsDeleted', () => {
            it('should set deleted_at when marking as deleted', () => {
                const lead = buildLead();

                expect(lead.deleted_at).toBeNull();

                lead.markAsDeleted();

                expect(lead.deleted_at).toBeInstanceOf(Date);
            });

            it('should update updated_at when marking as deleted', () => {
                const lead = buildLead();
                const oldUpdatedAt = lead.updated_at;

                lead.markAsDeleted();

                expect(lead.updated_at.getTime()).toBeGreaterThan(
                    oldUpdatedAt.getTime(),
                );
            });

            it('should preserve lead properties when marking as deleted', () => {
                const lead = buildLead();
                const originalOrg = lead.id_org;
                const originalState = lead.estado;

                lead.markAsDeleted();

                expect(lead.id_org).toBe(originalOrg);
                expect(lead.estado).toBe(originalState);
            });
        });
    });
});
