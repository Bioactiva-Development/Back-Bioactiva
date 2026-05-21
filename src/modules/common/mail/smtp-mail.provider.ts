import { MailProviderPort } from '@/modules/common/mail/mail-provider.port';
import { UserRole } from '@/shared/domain/enums/rol';
import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class SmtpMailProvider implements MailProviderPort {
    async sendInvitationEmail(input: {
        correo: string;
        token: string;
        rol: UserRole;
        invitedBy: number;
    }): Promise<void> {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation?token=${input.token}`;

        await transporter.sendMail({
            from: `${process.env.SMTP_FROM_NAME ?? 'Back Bioactiva'} <${process.env.SMTP_FROM}>`,
            to: input.correo,
            subject: 'Invitación a Back Bioactiva',
            html: `<p>Has sido invitado.</p><p><a href="${invitationLink}">Aceptar invitación</a></p>`,
        });
    }
}
