import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CotizacionActiva, LeadWithRelations } from '@/modules/leads/domain/ports/lead-repository.port';
import { ActivityAlertLevel } from '@/modules/leads/domain/enums/activity-alert-level';

export class LeadResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'EN_PROSPECTO' })
    estado: string;

    @ApiProperty({
        example: 'Consultoría en transformación digital',
    })
    servicioInteres: string;

    @ApiPropertyOptional({ example: 'Cliente interesado' })
    comentarios: string | null;

    @ApiPropertyOptional({
        example: 'Necesita optimizar procesos',
    })
    desafioOportunidad: string | null;

    @ApiPropertyOptional({ example: 'LinkedIn' })
    canalCaptacion: string | null;

    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    idOrg: string;

    @ApiProperty({ example: 'Bioactiva SAC' })
    organizationName: string;

    @ApiPropertyOptional({ example: 1 })
    idContacto: number | null;

    @ApiPropertyOptional({ example: 'Juan Pérez' })
    contactName: string | null;

    @ApiProperty({ example: 1 })
    idEncargado: number;

    @ApiProperty({ example: 'Carlos López' })
    encargadoName: string;

    @ApiProperty({ example: 1 })
    idAuthor: number;

    @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
    updatedAt: Date;

    @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
    ultimoCambioEstado: Date;

    @ApiProperty({
        enum: ActivityAlertLevel,
        example: ActivityAlertLevel.PENDIENTE,
        description:
            'Semáforo de actividades del lead: SIN_ACTIVIDADES (sin pendientes), PENDIENTE (sin urgencia inmediata) o POR_VENCER (alguna actividad vence en ≤2 días o ya está vencida).',
    })
    activityAlert: ActivityAlertLevel;

    @ApiPropertyOptional({
        nullable: true,
        description: 'Cotización activa (no rechazada) del lead. null si no tiene ninguna.',
        example: { id: 12, monto: 4500.00, tipo: 'PEN', estado: 'ENVIADA' },
    })
    cotizacionActiva: CotizacionActiva | null;

    constructor(enriched: LeadWithRelations) {
        this.id = enriched.lead.id!;
        this.estado = enriched.lead.estado;
        this.servicioInteres = enriched.lead.servicio_interes;
        this.comentarios = enriched.lead.comentarios;
        this.desafioOportunidad = enriched.lead.desafio_oportunidad;
        this.canalCaptacion = enriched.lead.canal_captacion;
        this.idOrg = enriched.lead.id_org;
        this.organizationName = enriched.organizationName;
        this.idContacto = enriched.lead.id_contacto;
        this.contactName = enriched.contactName;
        this.idEncargado = enriched.lead.id_encargado;
        this.encargadoName = `${enriched.encargadoNombre} ${enriched.encargadoApellidos}`;
        this.idAuthor = enriched.lead.id_author;
        this.createdAt = enriched.lead.created_at;
        this.updatedAt = enriched.lead.updated_at;
        this.ultimoCambioEstado = enriched.lead.ultimo_cambio;
        this.activityAlert = enriched.activityAlert;
        this.cotizacionActiva = enriched.cotizacionActiva;
    }
}
