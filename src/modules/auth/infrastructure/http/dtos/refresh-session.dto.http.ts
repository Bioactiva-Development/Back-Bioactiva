import { IsNotEmpty } from 'class-validator';

export class RefreshSessionDto {
    constructor(refreshToken: string) {
        this.refreshToken = refreshToken;
    }
    @IsNotEmpty()
    refreshToken: string;
}
