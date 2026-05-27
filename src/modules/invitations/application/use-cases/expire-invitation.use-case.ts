import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    INVITATIONS_REPOSITORY,
    type InvitationsRepositoryPort,
} from '@/modules/invitations/domain/port/invitations-repository.port';

export class ExpireInvitationUseCase {
    constructor(
        @Inject(INVITATIONS_REPOSITORY)
        private readonly invitationsRepository: InvitationsRepositoryPort,
    ) {}

    async execute(id: number): Promise<boolean> {
        const invitation = await this.invitationsRepository.findById(id);
        if (!invitation) return false;

        if (!invitation.isPending()) {
            return false;
        }

        invitation.expire();
        await this.invitationsRepository.save(invitation);
        return true;
    }
}
