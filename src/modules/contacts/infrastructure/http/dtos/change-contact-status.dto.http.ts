import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';

export class HttpChangeContactStatusDto {
    @ApiProperty({
        enum: EstadoCorreo,
        example: EstadoCorreo.VENCIDO,
        description: 'Nuevo estado del contacto: VIGENTE o VENCIDO',
    })
    @IsEnum(EstadoCorreo)
    estado_correo!: EstadoCorreo;
}
