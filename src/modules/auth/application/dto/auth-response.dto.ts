import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
    @ApiProperty({
        description: 'JWT de acceso a usar en el header Authorization',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    readonly accessToken: string;

    @ApiProperty({
        description: 'Tiempo de expiración del access token, en segundos',
        example: 900,
    })
    readonly accessTokenExpiresIn: number;

    constructor(accessToken: string, accessTokenExpiresIn: number) {
        this.accessToken = accessToken;
        this.accessTokenExpiresIn = accessTokenExpiresIn;
    }

    static fromTokenPair(
        accessToken: string,
        accessTokenExpiresIn: number,
    ): AuthResponseDto {
        return new AuthResponseDto(accessToken, accessTokenExpiresIn);
    }
}
