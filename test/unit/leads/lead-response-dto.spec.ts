import { describe, expect, it } from '@jest/globals';
import { LeadResponseDto } from '@/modules/leads/infrastructure/http/dto/lead-response.dto';

describe('Leads module', () => {
    describe('LeadResponseDto', () => {
        const enriched: any = {
            lead: {
                id: 1,
                estado: 'EN_PROSPECTO',
                servicio_interes: 'Consultoría',
                comentarios: 'c',
                desafio_oportunidad: 'd',
                notas_contacto: 'n',
                canal_captacion: 'LinkedIn',
                id_org: 'org-1',
                id_contacto: 5,
                id_encargado: 2,
                id_author: 3,
                created_at: new Date('2026-01-01T00:00:00.000Z'),
                updated_at: new Date('2026-01-02T00:00:00.000Z'),
                ultimo_cambio: new Date('2026-01-03T00:00:00.000Z'),
            },
            organizationName: 'Bioactiva SAC',
            encargadoNombre: 'Carlos',
            encargadoApellidos: 'López',
            contactName: 'Juan Pérez',
        };

        it('maps lead fields and derived names', () => {
            const dto = new LeadResponseDto(enriched);

            expect(dto.id).toBe(1);
            expect(dto.estado).toBe('EN_PROSPECTO');
            expect(dto.servicioInteres).toBe('Consultoría');
            expect(dto.idOrg).toBe('org-1');
            expect(dto.organizationName).toBe('Bioactiva SAC');
            expect(dto.idContacto).toBe(5);
            expect(dto.contactName).toBe('Juan Pérez');
            expect(dto.idEncargado).toBe(2);
            expect(dto.encargadoName).toBe('Carlos López');
            expect(dto.idAuthor).toBe(3);
            expect(dto.ultimoCambioEstado).toEqual(
                new Date('2026-01-03T00:00:00.000Z'),
            );
        });
    });
});
