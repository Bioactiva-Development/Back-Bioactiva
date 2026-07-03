import { ApiProperty } from '@nestjs/swagger';

export class ConnectionStatusDto {
    @ApiProperty({
        description:
            'Indica si el usuario tiene una cuenta de Microsoft conectada',
        example: true,
    })
    readonly connected: boolean;

    @ApiProperty({
        description:
            'Correo de la cuenta de Microsoft conectada, o null si no hay conexión',
        example: 'usuario@bioactiva.com',
        nullable: true,
    })
    readonly microsoftEmail: string | null;

    constructor(connected: boolean, microsoftEmail: string | null) {
        this.connected = connected;
        this.microsoftEmail = microsoftEmail;
    }
}
