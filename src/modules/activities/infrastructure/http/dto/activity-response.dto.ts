import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ActivityWithRelations } from '@/modules/activities/domain/ports/activity-repository.port';

export class ActivityResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Llamada de seguimiento' })
    nombreActividad: string;

    @ApiProperty({ example: 'LLAMADA' })
    tipo: string;

    @ApiProperty({ example: 'PENDIENTE' })
    estado: string;

    @ApiProperty({ example: '2026-06-01T10:00:00.000Z' })
    fechaInicio: Date;

    @ApiProperty({ example: '2026-06-01T11:00:00.000Z' })
    fechaFin: Date;

    @ApiPropertyOptional({ example: 'Confirmar detalles del proyecto' })
    notas: string | null;

    @ApiProperty({ example: 1 })
    idLead: number;

    @ApiProperty({ example: 'Consultoría en transformación digital' })
    leadServicioInteres: string;

    @ApiProperty({ example: 'EN_PROSPECTO' })
    leadEstado: string;

    @ApiProperty({ example: 1 })
    idResponsable: number;

    @ApiProperty({ example: 'Carlos López' })
    responsableName: string;

    @ApiPropertyOptional({
        example: 'AAMkAGI2...',
        description:
            'ID del evento en Outlook si la actividad está sincronizada',
    })
    outlookEventId: string | null;

    @ApiPropertyOptional({
        example: 'https://teams.microsoft.com/l/meetup-join/...',
        description: 'URL de la reunión de Teams si se generó',
    })
    teamsMeetingUrl: string | null;

    @ApiProperty({ example: '2026-05-31T10:30:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-05-31T10:30:00.000Z' })
    updatedAt: Date;

    constructor(enriched: ActivityWithRelations) {
        this.id = enriched.activity.id;
        this.nombreActividad = enriched.activity.nombre_actividad;
        this.tipo = enriched.activity.tipo;
        this.estado = enriched.activity.estado;
        this.fechaInicio = enriched.activity.fecha_inicio;
        this.fechaFin = enriched.activity.fecha_fin;
        this.notas = enriched.activity.notas;
        this.idLead = enriched.activity.id_lead;
        this.leadServicioInteres = enriched.leadServicioInteres;
        this.leadEstado = enriched.leadEstado;
        this.idResponsable = enriched.activity.id_responsable;
        this.responsableName =
            `${enriched.responsableNombre} ${enriched.responsableApellidos}`.trim();
        this.outlookEventId = enriched.activity.outlook_event_id;
        this.teamsMeetingUrl = enriched.activity.teams_meeting_url;
        this.createdAt = enriched.activity.created_at;
        this.updatedAt = enriched.activity.updated_at;
    }
}
