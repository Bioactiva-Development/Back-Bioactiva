import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    INVITATIONS_REPOSITORY,
    type InvitationsRepositoryPort,
} from '@/modules/invitations/domain/port/invitations-repository.port';

export class ExpireOverdueInvitationsUseCase {
    constructor(
        @Inject(INVITATIONS_REPOSITORY)
        private readonly invitationsRepository: InvitationsRepositoryPort,
    ) {}

    async execute(now: Date = new Date()): Promise<number> {
        const overdueInvitations =
            await this.invitationsRepository.findPendingExpired(now);

        let expiredCount = 0;

        for (const invitation of overdueInvitations) {
            invitation.expire();
            await this.invitationsRepository.save(invitation);
            expiredCount += 1;
        }

        return expiredCount;
    }
}
