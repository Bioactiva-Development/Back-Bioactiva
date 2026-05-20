import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AllowedEmailDomainsConfig {
    constructor(private readonly configService: ConfigService) {}

    getAllowedDomains(): string[] {
        return (
            this.configService
                .get<string>('ALLOWED_EMAIL_DOMAINS')
                ?.split(',') ?? []
        );
    }
}
