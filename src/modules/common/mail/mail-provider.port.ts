import { UserRole } from '@/shared/domain/enums/rol';

export interface MailProviderPort {
    sendInvitationEmail(input: {
        correo: string;
        token: string;
        rol: UserRole;
        invitedBy: number;
    }): Promise<void>;

    sendResetPasswordEmail(input: {
        correo: string;
        token: string;
    }): Promise<void>;

    sendGenericEmail(input: {
        to: string;
        subject: string;
        html: string;
    }): Promise<void>;
}
