import { Injectable, Logger } from '@nestjs/common';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import {
    RecaptchaVerificationResult,
    RecaptchaVerifierPort,
} from '@/modules/auth/domain/ports/recaptcha-verifier.port';
import { RecaptchaConfig } from '@/modules/auth/infrastructure/config/recaptcha.config';

@Injectable()
export class RecaptchaEnterpriseVerifier implements RecaptchaVerifierPort {
    private readonly logger = new Logger(RecaptchaEnterpriseVerifier.name);
    private client?: RecaptchaEnterpriseServiceClient;

    constructor(private readonly config: RecaptchaConfig) {}

    async verify(
        token: string,
        expectedAction: string,
    ): Promise<RecaptchaVerificationResult> {
        // Bypass para entornos sin credenciales (dev/CI): RECAPTCHA_ENABLED=false.
        if (!this.config.enabled) {
            return { valid: true, score: 1 };
        }

        const client = this.getClient();
        const projectPath = client.projectPath(this.config.projectId);

        const [assessment] = await client.createAssessment({
            parent: projectPath,
            assessment: {
                event: {
                    token,
                    siteKey: this.config.siteKey,
                    expectedAction,
                },
            },
        });

        const tokenProperties = assessment.tokenProperties;

        if (!tokenProperties?.valid) {
            this.logger.warn(
                `Token de reCAPTCHA inválido: ${tokenProperties?.invalidReason ?? 'desconocido'}`,
            );
            return { valid: false, score: 0 };
        }

        // reCAPTCHA v2 (checkbox) no emite action ni score: basta con que el
        // token sea válido. Devolvemos score 1 para superar el umbral del guard.
        if (this.config.mode === 'checkbox') {
            return { valid: true, score: 1 };
        }

        if (tokenProperties.action !== expectedAction) {
            this.logger.warn(
                `Acción de reCAPTCHA inesperada: esperada "${expectedAction}", recibida "${tokenProperties.action}"`,
            );
            return { valid: false, score: 0 };
        }

        const score = assessment.riskAnalysis?.score ?? 0;
        return { valid: true, score };
    }

    private getClient(): RecaptchaEnterpriseServiceClient {
        this.client ??= new RecaptchaEnterpriseServiceClient();
        return this.client;
    }
}
