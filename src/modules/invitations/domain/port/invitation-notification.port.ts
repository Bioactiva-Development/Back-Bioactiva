import { UserRole } from '@/shared/domain/enums/rol';

export interface InvitationNotificationPort {
    enqueueInvitationEmail(input: {
        correo: string;
        token: string;
        rol: UserRole;
        invitedBy: number;
    }): Promise<void>;
}
