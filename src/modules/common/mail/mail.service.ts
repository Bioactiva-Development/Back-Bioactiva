import { GraphMailProvider } from '@/modules/common/mail/graph-mail.provider';
import { MockMailProvider } from '@/modules/common/mail/mock-mail.provider';
import { SmtpMailProvider } from '@/modules/common/mail/smtp-mail.provider';
import { UserRole } from '@/shared/domain/enums/rol';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
    constructor(
        private readonly mockProvider: MockMailProvider,
        private readonly smtpProvider: SmtpMailProvider,
        private readonly graphProvider: GraphMailProvider,
    ) {}

    async sendInvitationEmail(input: {
        correo: string;
        token: string;
        rol: UserRole;
        invitedBy: number;
    }): Promise<void> {
        const provider = process.env.MAIL_PROVIDER ?? 'mock';

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
        const provider = process.env.MAIL_PROVIDER ?? 'mock';

        if (provider === 'graph') {
            return this.graphProvider.sendResetPasswordEmail(input);
        }

        if (provider === 'smtp') {
            return this.smtpProvider.sendResetPasswordEmail(input);
        }

        return this.mockProvider.sendResetPasswordEmail(input);
    }
}
