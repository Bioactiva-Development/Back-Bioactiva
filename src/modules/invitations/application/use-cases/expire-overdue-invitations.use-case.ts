import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    INVITATIONS_REPOSITORY,
    type InvitationsRepositoryPort,
} from '@/modules/invitations/domain/port/invitations-repository.port';
import { DeactivateInvitedUserService } from '@/modules/invitations/application/services/deactivate-invited-user.service';

export class ExpireOverdueInvitationsUseCase {
    constructor(
        @Inject(INVITATIONS_REPOSITORY)
        private readonly invitationsRepository: InvitationsRepositoryPort,
        private readonly deactivateInvitedUser: DeactivateInvitedUserService,
    ) {}

    async execute(now: Date = new Date()): Promise<number> {
        const overdueInvitations =
            await this.invitationsRepository.findPendingExpired(now);

        let expiredCount = 0;

        for (const invitation of overdueInvitations) {
            invitation.expire();
            await this.invitationsRepository.save(invitation);
            await this.deactivateInvitedUser.execute(invitation.correo);
            expiredCount += 1;
        }

        return expiredCount;
    }
}
