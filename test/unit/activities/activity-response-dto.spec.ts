import { describe, expect, it } from '@jest/globals';
import { ActivityResponseDto } from '@/modules/activities/infrastructure/http/dto/activity-response.dto';

describe('Activities module', () => {
    describe('ActivityResponseDto', () => {
        const enriched: any = {
            activity: {
                id: 1,
                nombre_actividad: 'Llamada de seguimiento',
                tipo: 'LLAMADA',
                estado: 'PENDIENTE',
                fecha_inicio: new Date('2026-06-01T10:00:00.000Z'),
                fecha_fin: new Date('2026-06-01T11:00:00.000Z'),
                notas: 'Confirmar detalles',
                id_lead: 7,
                id_responsable: 2,
                outlook_event_id: 'evt-1',
                teams_meeting_url: 'https://teams/x',
                created_at: new Date('2026-05-31T10:30:00.000Z'),
                updated_at: new Date('2026-05-31T10:30:00.000Z'),
            },
            leadServicioInteres: 'Consultoría',
            leadEstado: 'EN_PROSPECTO',
            responsableNombre: 'Carlos',
            responsableApellidos: 'López',
        };

        it('maps activity fields and derived responsable name', () => {
            const dto = new ActivityResponseDto(enriched);

            expect(dto.id).toBe(1);
            expect(dto.nombreActividad).toBe('Llamada de seguimiento');
            expect(dto.tipo).toBe('LLAMADA');
            expect(dto.estado).toBe('PENDIENTE');
            expect(dto.idLead).toBe(7);
            expect(dto.leadServicioInteres).toBe('Consultoría');
            expect(dto.leadEstado).toBe('EN_PROSPECTO');
            expect(dto.idResponsable).toBe(2);
            expect(dto.responsableName).toBe('Carlos López');
            expect(dto.outlookEventId).toBe('evt-1');
            expect(dto.teamsMeetingUrl).toBe('https://teams/x');
        });
    });
});
