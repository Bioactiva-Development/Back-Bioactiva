import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecaptchaConfig {
    constructor(private readonly configService: ConfigService) {}

    get enabled(): boolean {
        return (
            this.configService.get<string>('RECAPTCHA_ENABLED', 'false') ===
            'true'
        );
    }

    /**
     * 'checkbox' (reCAPTCHA v2: solo valida el token, sin score ni action)
     * o 'score' (reCAPTCHA v3/Enterprise: valida action y exige un score mínimo).
     */
    get mode(): 'checkbox' | 'score' {
        return this.configService.get<string>('RECAPTCHA_MODE', 'checkbox') ===
            'score'
            ? 'score'
            : 'checkbox';
    }

    get projectId(): string {
        return this.configService.getOrThrow<string>('GOOGLE_CLOUD_PROJECT_ID');
    }

    get siteKey(): string {
        return this.configService.getOrThrow<string>('RECAPTCHA_SITE_KEY');
    }

    get minScore(): number {
        return Number(
            this.configService.get<string>('RECAPTCHA_MIN_SCORE', '0.5'),
        );
    }

    get loginAction(): string {
        return this.configService.get<string>(
            'RECAPTCHA_LOGIN_ACTION',
            'login',
        );
    }
}
