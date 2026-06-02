import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { InvitationEmailProcessor } from '@/modules/invitations/infrastructure/mail/invitation-email.processor';
import { InvitationExpirationProcessor } from '@/modules/invitations/infrastructure/mail/invitation-expiration.processor';
import { MailService } from '@/modules/common/mail/mail.service';
import { ExpireInvitationUseCase } from '@/modules/invitations/application/use-cases/expire-invitation.use-case';
import { UserRole } from '@/shared/domain/enums/rol';

describe('Invitation Processors', () => {
    let mockMailService: jest.Mocked<MailService>;
    let mockExpireInvitationUseCase: jest.Mocked<ExpireInvitationUseCase>;

    const makeJob = (name: string, data: any) => ({
        name,
        data,
    }) as any;

    beforeEach(() => {
        mockMailService = { sendInvitationEmail: jest.fn(), sendResetPasswordEmail: jest.fn() } as any;
        mockExpireInvitationUseCase = { execute: jest.fn() } as any;
    });

    describe('InvitationEmailProcessor', () => {
        it('should send invitation email for matching job name', async () => {
            const processor = new InvitationEmailProcessor(mockMailService);
            const job = makeJob('send-invitation-email', {
                correo: 'user@test.com',
                token: 'token-abc',
                rol: UserRole.TRABAJADOR,
                invitedBy: 1,
            });

            await processor.process(job);

            expect(mockMailService.sendInvitationEmail).toHaveBeenCalledWith(job.data);
        });

        it('should skip processing for non-matching job name', async () => {
            const processor = new InvitationEmailProcessor(mockMailService);
            const job = makeJob('other-job', { correo: 'user@test.com' });

            await processor.process(job);

            expect(mockMailService.sendInvitationEmail).not.toHaveBeenCalled();
        });
    });

    describe('InvitationExpirationProcessor', () => {
        it('should expire invitation for matching job name', async () => {
            const processor = new InvitationExpirationProcessor(mockExpireInvitationUseCase);
            mockExpireInvitationUseCase.execute.mockResolvedValue(true);

            await processor.process(makeJob('expire-invitation', { invitationId: 1 }));

            expect(mockExpireInvitationUseCase.execute).toHaveBeenCalledWith(1);
        });

        it('should skip processing for non-matching job name', async () => {
            const processor = new InvitationExpirationProcessor(mockExpireInvitationUseCase);
            const job = makeJob('other-job', { invitationId: 1 });

            await processor.process(job);

            expect(mockExpireInvitationUseCase.execute).not.toHaveBeenCalled();
        });

        it('should handle already expired invitation gracefully', async () => {
            const processor = new InvitationExpirationProcessor(mockExpireInvitationUseCase);
            mockExpireInvitationUseCase.execute.mockResolvedValue(false);

            await expect(processor.process(makeJob('expire-invitation', { invitationId: 1 }))).resolves.toBeUndefined();
        });
    });
});
