import { describe, expect, it } from '@jest/globals';
import { LeadMapper } from '@/modules/leads/infrastructure/mappers/lead.mapper';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';

describe('Leads module', () => {
    describe('LeadMapper (uncovered state branches)', () => {
        it('maps every PrismaLeadState to its domain LeadState', () => {
            expect(LeadMapper.mapState('EN_PROSPECTO')).toBe(
                LeadState.EN_PROSPECTO,
            );
            expect(LeadMapper.mapState('OFERTADO')).toBe(LeadState.OFERTADO);
            expect(LeadMapper.mapState('CIERRE_CON_VENTA')).toBe(
                LeadState.CIERRE_CON_VENTA,
            );
            expect(LeadMapper.mapState('CIERRE_SIN_VENTA')).toBe(
                LeadState.CIERRE_SIN_VENTA,
            );
        });

        it('maps every domain LeadState to its PrismaLeadState', () => {
            expect(LeadMapper.mapStateToPrisma(LeadState.EN_PROSPECTO)).toBe(
                'EN_PROSPECTO',
            );
            expect(LeadMapper.mapStateToPrisma(LeadState.OFERTADO)).toBe(
                'OFERTADO',
            );
            expect(
                LeadMapper.mapStateToPrisma(LeadState.CIERRE_CON_VENTA),
            ).toBe('CIERRE_CON_VENTA');
            expect(
                LeadMapper.mapStateToPrisma(LeadState.CIERRE_SIN_VENTA),
            ).toBe('CIERRE_SIN_VENTA');
        });

        it('round-trips a CIERRE_CON_VENTA record through toDomain', () => {
            const createdAt = new Date('2026-01-01T00:00:00.000Z');
            const record: any = {
                id: 5,
                idOrg: 'org-1',
                idContacto: 7,
                estado: 'CIERRE_CON_VENTA',
                servicioInteres: 'Consultoría',
                comentarios: null,
                desafioOportunidad: null,
                idEncargado: 1,
                canalCaptacion: null,
                idAuthor: 2,
                createdAt,
                updatedAt: createdAt,
                deletedAt: null,
                ultimoCambioEstado: createdAt,
                fechaCierre: createdAt,
            };

            const lead = LeadMapper.toDomain(record);

            expect(lead.estado).toBe(LeadState.CIERRE_CON_VENTA);
        });
    });
});
