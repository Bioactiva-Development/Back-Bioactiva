import { describe, expect, it } from '@jest/globals';
import { ActivityResponseDto } from '@/modules/activities/infrastructure/http/dto/activity-response.dto';

describe('Activities module', () => {
    describe('ActivityResponseDto — optional fields', () => {
        const build = (overrides: any = {}) =>
            ({
                activity: {
                    id: 1,
                    nombre_actividad: 'Llamada',
                    tipo: 'LLAMADA',
                    estado: 'PENDIENTE',
                    fecha_inicio: new Date('2026-06-01T10:00:00.000Z'),
                    fecha_fin: new Date('2026-06-01T11:00:00.000Z'),
                    notas: null,
                    id_lead: 1,
                    id_responsable: 1,
                    outlook_event_id: null,
                    teams_meeting_url: null,
                    created_at: new Date('2026-05-31T10:30:00.000Z'),
                    updated_at: new Date('2026-05-31T10:30:00.000Z'),
                    ...(overrides.activity ?? {}),
                },
                leadServicioInteres: 'Consultoría',
                leadEstado: 'EN_PROSPECTO',
                responsableNombre: 'Carlos',
                responsableApellidos: 'López',
                ...overrides,
            }) as any;

        it('maps null optional fields as null', () => {
            const dto = new ActivityResponseDto(build());
            expect(dto.notas).toBeNull();
            expect(dto.outlookEventId).toBeNull();
            expect(dto.teamsMeetingUrl).toBeNull();
            expect(dto.responsableName).toBe('Carlos López');
        });

        it('maps populated optional fields', () => {
            const dto = new ActivityResponseDto(
                build({
                    activity: {
                        notas: 'Confirmar detalles',
                        outlook_event_id: 'AAMkAGI2',
                        teams_meeting_url: 'https://teams/x',
                    },
                }),
            );
            expect(dto.notas).toBe('Confirmar detalles');
            expect(dto.outlookEventId).toBe('AAMkAGI2');
            expect(dto.teamsMeetingUrl).toBe('https://teams/x');
        });
    });
});
