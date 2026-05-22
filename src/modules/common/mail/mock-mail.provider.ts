import { MailProviderPort } from '@/modules/common/mail/mail-provider.port';
import { UserRole } from '@/shared/domain/enums/rol';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MockMailProvider implements MailProviderPort {
    private readonly logger = new Logger(MockMailProvider.name);

    async sendInvitationEmail(input: {
        correo: string;
        token: string;
        rol: UserRole;
        invitedBy: number;
    }): Promise<void> {
        const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation?token=${input.token}`;
        this.logger.log(`Mock mail to ${input.correo} -> ${invitationLink}`);
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simula un pequeño retraso // Para evitar el ruido de eslint
    }

    async sendResetPasswordEmail(input: {
        correo: string;
        token: string;
    }): Promise<void> {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${input.token}`;
        this.logger.log(`Mock reset password mail to ${input.correo} -> ${resetLink}`);
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
}
