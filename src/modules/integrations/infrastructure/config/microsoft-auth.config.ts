import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MicrosoftAuthConfig {
    constructor(private readonly configService: ConfigService) {}

    get clientId(): string {
        return this.configService.getOrThrow<string>('AZURE_CLIENT_ID');
    }

    get clientSecret(): string {
        return this.configService.getOrThrow<string>('AZURE_CLIENT_SECRET');
    }

    get tenantId(): string {
        return this.configService.getOrThrow<string>('AZURE_TENANT_ID');
    }

    get redirectUri(): string {
        return this.configService.get<string>(
            'MICROSOFT_REDIRECT_URI',
            'http://localhost:3000/microsoft/callback',
        );
    }

    get scopes(): string[] {
        const raw = this.configService.get<string>(
            'MICROSOFT_SCOPES',
            'openid profile email offline_access User.Read',
        );
        return raw.split(' ').filter(Boolean);
    }

    get authority(): string {
        return `https://login.microsoftonline.com/${this.tenantId}`;
    }
}
