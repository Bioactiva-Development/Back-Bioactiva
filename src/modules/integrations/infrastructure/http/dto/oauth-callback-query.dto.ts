import { IsString, IsNotEmpty } from 'class-validator';

export class OAuthCallbackQueryDto {
    @IsString()
    @IsNotEmpty()
    code!: string;

    @IsString()
    @IsNotEmpty()
    state!: string;
}
