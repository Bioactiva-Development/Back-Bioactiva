import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateTokenDto {
    constructor(token: string) {
        this.token = token;
    }

    @IsNotEmpty({ message: 'El token es obligatorio' })
    @IsString()
    token: string;
}
