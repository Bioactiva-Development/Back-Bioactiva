import { UserRole } from '@/shared/domain/enums/rol';
import { Resend } from 'resend';

export class ResendMailProvider {
    constructor() {
        if (!ResendMailProvider.instance) {
            ResendMailProvider.instance = new Resend(process.env.RESEND_TOKEN);
        }
    }

    private static instance: Resend;

    async sendInvitationEmail(input: {
        correo: string;
        token: string;
        rol: UserRole;
        invitedBy: number;
    }): Promise<void> {
        const resend = ResendMailProvider.instance;
        const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation?token=${input.token}`;
        console.log('Sending email to:', input.correo);
        await resend.emails.send({
            from: 'Bioactiva <onboarding@resend.dev>',
            to: input.correo,
            subject: 'Invitación a Back Bioactiva',
            html: `<p>Has sido invitado.</p><p><a href="${invitationLink}">Aceptar invitación</a></p>`,
        });
    }
}
