import { ApiProperty } from '@nestjs/swagger';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';

export class EmailTemplateResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    nombre: string;

    @ApiProperty()
    asunto: string;

    @ApiProperty()
    cuerpo: string;

    @ApiProperty()
    activo: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    constructor(template: EmailTemplate) {
        this.id = template.id!;
        this.nombre = template.nombre;
        this.asunto = template.asunto;
        this.cuerpo = template.cuerpo;
        this.activo = template.activo;
        this.createdAt = template.created_at;
        this.updatedAt = template.updated_at;
    }
}
