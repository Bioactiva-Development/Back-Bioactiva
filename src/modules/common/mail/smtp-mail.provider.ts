import { MailProviderPort } from '@/modules/common/mail/mail-provider.port';
import { UserRole } from '@/shared/domain/enums/rol';
import { Injectable } from '@nestjs/common';
//import nodemailer from 'nodemailer';
//import { MailtrapTransport } from 'mailtrap'; is limited
import { ResendMailProvider } from '@/modules/common/mail/resend.instance';
//trying with resend
@Injectable()
export class SmtpMailProvider implements MailProviderPort {
    async sendInvitationEmail(input: {
        correo: string;
        token: string;
        rol: UserRole;
        invitedBy: number;
    }): Promise<void> {
        //Now we are going to use the resend provider, but we can switch to nodemailer if needed, just need to uncomment the code and add the mailtrap token to the env variables, also need to install the mailtrap package and nodemailer
        /* const transporter = nodemailer.createTransport(
            MailtrapTransport({
                token: process.env.MAILTRAP_TOKEN || '',
                //sandbox: process.env.NODE_ENV !== 'production',
                //testInboxId: 4650783,
            }),
        ); */

        //const sender = {
        //    address: 'hello@demomailtrap.co',
        //    name: 'Mailtrap Code',
        //};

        const resendProvider = new ResendMailProvider();

        await resendProvider.sendInvitationEmail({
            correo: input.correo,
            token: input.token,
            rol: input.rol,
            invitedBy: input.invitedBy,
        });
        /* await transporter.sendMail({
            from: sender,
            to: input.correo,
            subject: 'Invitación a Back Bioactiva',
            html: `<p>Has sido invitado.</p><p><a href="${invitationLink}">Aceptar invitación</a></p>`,
        }); */
    }
}
