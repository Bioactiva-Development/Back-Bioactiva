import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class OAuthCallbackQueryDto {
    @IsString()
    @IsNotEmpty()
    code!: string;

    @IsString()
    @IsNotEmpty()
    state!: string;

    @IsString()
    @IsOptional()
    client_info?: string;

    @IsString()
    @IsOptional()
    clientdata?: string;
}
