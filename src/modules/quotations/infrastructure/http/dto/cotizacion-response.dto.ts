import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CotizacionWithRelations } from '@/modules/quotations/domain/ports/cotizacion-repository.port';

export class CotizacionResponseDto {
    @ApiProperty({ example: 1 }) id: number;
    @ApiProperty({ example: '2026-06-01T10:00:00.000Z' }) fechaCot: Date;
    @ApiPropertyOptional({ example: 'Dr. Martinez' }) dirigido: string | null;
    @ApiPropertyOptional({ example: 'TechCorp SA' }) cliente: string | null;
    @ApiPropertyOptional({ example: 'Licencia Software Pro' }) producto:
        | string
        | null;
    @ApiProperty({ example: 'Juan Perez' }) nombreRemitente: string;
    @ApiProperty({ example: 'Desarrollo Customizado' }) nombreServicio: string;
    @ApiProperty({ example: '5000.00' }) monto: string;
    @ApiProperty({ example: 'USD' }) tipo: string;
    @ApiProperty({ example: 'PENDIENTE' }) estado: string;
    @ApiPropertyOptional({ example: 'Incluye 3 meses de soporte' })
    observacion: string | null;
    @ApiPropertyOptional({ example: 'https://proposal.techcorp.com/cot-001' })
    linkPropuesta: string | null;
    @ApiProperty({ example: 1 }) idLead: number;
    @ApiProperty({ example: 'Consultoría en transformación digital' })
    leadServicioInteres: string;
    @ApiProperty({ example: 'EN_PROSPECTO' }) leadEstado: string;
    @ApiProperty({ example: 'María Gómez' }) contactName: string;
    @ApiProperty({ example: 1 }) idRemitente: number;
    @ApiProperty({ example: 'Carlos López' }) remitenteName: string;
    @ApiProperty({ example: 1 }) idAuthor: number;
    @ApiProperty({ example: '2026-01-15T10:30:00.000Z' }) createdAt: Date;
    @ApiProperty({ example: '2026-01-15T10:30:00.000Z' }) updatedAt: Date;

    constructor(enriched: CotizacionWithRelations) {
        this.id = enriched.cotizacion.id!;
        this.fechaCot = enriched.cotizacion.fecha_cot;
        this.dirigido = enriched.cotizacion.dirigido;
        this.cliente = enriched.cotizacion.cliente;
        this.producto = enriched.cotizacion.producto;
        this.nombreRemitente = enriched.cotizacion.nombre_remitente;
        this.nombreServicio = enriched.cotizacion.nombre_servicio;
        this.monto = enriched.cotizacion.monto;
        this.tipo = enriched.cotizacion.tipo;
        this.estado = enriched.cotizacion.estado;
        this.observacion = enriched.cotizacion.observacion;
        this.linkPropuesta = enriched.cotizacion.link_propuesta;
        this.idLead = enriched.cotizacion.id_lead;
        this.leadServicioInteres = enriched.leadServicioInteres;
        this.leadEstado = enriched.leadEstado;
        this.contactName = enriched.contactName;
        this.idRemitente = enriched.cotizacion.id_remitente;
        this.remitenteName =
            `${enriched.remitenteNombre} ${enriched.remitenteApellidos}`.trim();
        this.idAuthor = enriched.cotizacion.id_author;
        this.createdAt = enriched.cotizacion.created_at;
        this.updatedAt = enriched.cotizacion.updated_at;
    }
}
