import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactWithOrgName } from '@/modules/contacts/domain/ports/contact.repository';

export class ContactResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Juan' })
    nombres: string;

    @ApiPropertyOptional({ example: 'Pérez' })
    apellidos: string | null;

    @ApiPropertyOptional({ example: 'SR' })
    vocativo: string | null;

    @ApiPropertyOptional({ example: 'Gerente General' })
    cargo: string | null;

    @ApiProperty({ example: 'juan@example.com' })
    correo: string;

    @ApiPropertyOptional({ example: '999888777' })
    telefono: string | null;

    @ApiPropertyOptional({ example: 'juan2@example.com' })
    correo2: string | null;

    @ApiPropertyOptional({ example: 'Cliente VIP' })
    comentarios: string | null;

    @ApiProperty({ example: 'VIGENTE' })
    estado_correo: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    idOrganizacion: string;

    @ApiProperty({ example: 'Bioactiva SAC' })
    organizacionNombre: string;

    @ApiProperty({ example: 1 })
    idAuthor: number;

    @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
    createdAt: Date;

    constructor(enriched: ContactWithOrgName) {
        this.id = enriched.contact.id;
        this.nombres = enriched.contact.nombres;
        this.apellidos = enriched.contact.apellidos;
        this.vocativo = enriched.contact.vocativo;
        this.cargo = enriched.contact.cargo;
        this.correo = enriched.contact.correo;
        this.telefono = enriched.contact.telefono;
        this.correo2 = enriched.contact.correo2;
        this.comentarios = enriched.contact.comentarios;
        this.estado_correo = enriched.contact.estado_correo;
        this.idOrganizacion = enriched.contact.idOrganizacion;
        this.organizacionNombre = enriched.organizationName;
        this.idAuthor = enriched.contact.idAuthor;
        this.createdAt = enriched.contact.createdAt;
    }
}
