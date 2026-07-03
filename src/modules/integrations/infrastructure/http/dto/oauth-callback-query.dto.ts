import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class OAuthCallbackQueryDto {
    @ApiProperty({
        description: 'Código de autorización devuelto por Microsoft',
    })
    @IsString()
    @IsNotEmpty()
    code!: string;

    @ApiProperty({
        description:
            'Estado firmado enviado en /microsoft/connect (id de usuario + returnPath), verificado aquí',
    })
    @IsString()
    @IsNotEmpty()
    state!: string;

    @ApiPropertyOptional({
        description:
            'Metadata de cliente devuelta por Microsoft (no utilizada)',
    })
    @IsString()
    @IsOptional()
    client_info?: string;

    @ApiPropertyOptional({
        description: 'Datos de cliente devueltos por Microsoft (no utilizados)',
    })
    @IsString()
    @IsOptional()
    clientdata?: string;
}
