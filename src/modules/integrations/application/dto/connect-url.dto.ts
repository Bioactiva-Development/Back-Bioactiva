import { ApiProperty } from '@nestjs/swagger';

export class ConnectUrlDto {
    @ApiProperty({
        description:
            'URL de autorización de Microsoft a la que redirigir al usuario',
        example:
            'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?...',
    })
    readonly url: string;

    constructor(url: string) {
        this.url = url;
    }
}
