import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsOptional, ValidateNested } from 'class-validator';
import { HttpFollowUpEmailDto } from '@/modules/notifications/infrastructure/http/dto/create-follow-up.dto.http';

export class HttpEditFollowUpDto {
    @ApiPropertyOptional({
        example: 'cliente@empresa.com',
        description:
            'Nuevo correo del cliente (opcional). Si se omite, se conserva el actual; si se envía, debe pertenecer al contacto del lead.',
    })
    @IsOptional()
    @IsEmail()
    correoCliente?: string;

    @ApiProperty({
        type: HttpFollowUpEmailDto,
        description: 'Correo interno al responsable de la actividad',
    })
    @ValidateNested()
    @Type(() => HttpFollowUpEmailDto)
    internal!: HttpFollowUpEmailDto;

    @ApiProperty({
        type: HttpFollowUpEmailDto,
        description: 'Correo externo al cliente (posterior al interno)',
    })
    @ValidateNested()
    @Type(() => HttpFollowUpEmailDto)
    external!: HttpFollowUpEmailDto;
}
