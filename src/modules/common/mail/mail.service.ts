import { GraphMailProvider } from '@/modules/common/mail/graph-mail.provider';
import { MockMailProvider } from '@/modules/common/mail/mock-mail.provider';
import { SmtpMailProvider } from '@/modules/common/mail/smtp-mail.provider';
import { UserRole } from '@/shared/domain/enums/rol';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private warnedMock = false;

    constructor(
        private readonly mockProvider: MockMailProvider,
        private readonly smtpProvider: SmtpMailProvider,
        private readonly graphProvider: GraphMailProvider,
    ) {}

    /**
     * Resuelve el proveedor desde `MAIL_PROVIDER`. Si el valor no es `graph` ni
     * `smtp` —incluido el caso de que el `.env` no se haya cargado y quede
     * `undefined`— cae en `mock`, que NO envía correos reales (solo logea). Se
     * avisa una vez para que un arranque mal configurado en producción no falle
     * en silencio (síntoma típico: los jobs "completan" pero no llega nada).
     */
    private resolveProvider(): 'graph' | 'smtp' | 'mock' {
        const configured = process.env.MAIL_PROVIDER;
        if (configured === 'graph' || configured === 'smtp') {
            return configured;
        }
        if (!this.warnedMock) {
            this.logger.warn(
                `MAIL_PROVIDER="${configured ?? '(no definido)'}" no es 'graph' ni 'smtp'; ` +
                    'se usará el proveedor MOCK y NO se enviarán correos reales.',
            );
            this.warnedMock = true;
        }
        return 'mock';
    }

    async sendInvitationEmail(input: {
        correo: string;
        token: string;
        rol: UserRole;
        invitedBy: number;
    }): Promise<void> {
        const provider = this.resolveProvider();

        if (provider === 'graph') {
            return this.graphProvider.sendInvitationEmail(input);
        }

        if (provider === 'smtp') {
            return this.smtpProvider.sendInvitationEmail(input);
        }

        return this.mockProvider.sendInvitationEmail(input);
    }

    async sendResetPasswordEmail(input: {
        correo: string;
        token: string;
    }): Promise<void> {
        const provider = this.resolveProvider();

        if (provider === 'graph') {
            return this.graphProvider.sendResetPasswordEmail(input);
        }

        if (provider === 'smtp') {
            return this.smtpProvider.sendResetPasswordEmail(input);
        }

        return this.mockProvider.sendResetPasswordEmail(input);
    }

    async sendGenericEmail(input: {
        to: string;
        subject: string;
        html: string;
    }): Promise<void> {
        const provider = this.resolveProvider();

        if (provider === 'graph') {
            return this.graphProvider.sendGenericEmail(input);
        }

        if (provider === 'smtp') {
            return this.smtpProvider.sendGenericEmail(input);
        }

        return this.mockProvider.sendGenericEmail(input);
    }
}
