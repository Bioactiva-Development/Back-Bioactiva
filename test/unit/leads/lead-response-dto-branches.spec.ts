import { describe, expect, it } from '@jest/globals';
import { LeadResponseDto } from '@/modules/leads/infrastructure/http/dto/lead-response.dto';
import { ActivityAlertLevel } from '@/modules/leads/domain/enums/activity-alert-level';

describe('Leads module', () => {
    describe('LeadResponseDto — optional fields', () => {
        const build = (leadOverrides: any = {}, rest: any = {}) =>
            ({
                lead: {
                    id: 1,
                    estado: 'EN_PROSPECTO',
                    servicio_interes: 'Consultoría',
                    comentarios: null,
                    desafio_oportunidad: null,
                    canal_captacion: null,
                    id_org: 'org-1',
                    id_contacto: null,
                    id_encargado: 2,
                    id_author: 3,
                    created_at: new Date('2026-01-01T00:00:00.000Z'),
                    updated_at: new Date('2026-01-02T00:00:00.000Z'),
                    ultimo_cambio: new Date('2026-01-03T00:00:00.000Z'),
                    ...leadOverrides,
                },
                organizationName: 'Bioactiva SAC',
                contactName: null,
                encargadoNombre: 'Carlos',
                encargadoApellidos: 'López',
                activityAlert: ActivityAlertLevel.PENDIENTE,
                cotizacionActiva: null,
                ...rest,
            }) as any;

        it('maps null optional fields as null', () => {
            const dto = new LeadResponseDto(build());
            expect(dto.comentarios).toBeNull();
            expect(dto.desafioOportunidad).toBeNull();
            expect(dto.canalCaptacion).toBeNull();
            expect(dto.idContacto).toBeNull();
            expect(dto.contactName).toBeNull();
        });

        it('maps populated optional fields', () => {
            const dto = new LeadResponseDto(
                build(
                    {
                        comentarios: 'Interesado',
                        desafio_oportunidad: 'Optimizar',
                        canal_captacion: 'LinkedIn',
                        id_contacto: 5,
                    },
                    { contactName: 'Juan Pérez' },
                ),
            );
            expect(dto.comentarios).toBe('Interesado');
            expect(dto.desafioOportunidad).toBe('Optimizar');
            expect(dto.canalCaptacion).toBe('LinkedIn');
            expect(dto.idContacto).toBe(5);
            expect(dto.contactName).toBe('Juan Pérez');
        });
    });
});
