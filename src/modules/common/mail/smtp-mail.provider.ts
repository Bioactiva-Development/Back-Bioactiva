import { MailProviderPort } from '@/modules/common/mail/mail-provider.port';
import { UserRole } from '@/shared/domain/enums/rol';
import { Injectable } from '@nestjs/common';
import { ResendMailProvider } from '@/modules/common/mail/resend.instance';

@Injectable()
export class SmtpMailProvider implements MailProviderPort {
    async sendInvitationEmail(input: {
        correo: string;
        token: string;
        rol: UserRole;
        invitedBy: number;
    }): Promise<void> {
        const resendProvider = new ResendMailProvider();

        await resendProvider.sendInvitationEmail({
            correo: input.correo,
            token: input.token,
            rol: input.rol,
            invitedBy: input.invitedBy,
        });
    }

    async sendResetPasswordEmail(input: {
        correo: string;
        token: string;
    }): Promise<void> {
        const resendProvider = new ResendMailProvider();
        await resendProvider.sendResetPasswordEmail(input);
    }

    async sendGenericEmail(input: {
        to: string;
        subject: string;
        html: string;
    }): Promise<void> {
        const resendProvider = new ResendMailProvider();
        await resendProvider.sendGenericEmail(input);
    }
}
