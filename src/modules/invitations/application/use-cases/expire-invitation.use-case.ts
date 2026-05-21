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

    async execute(id: number) {
        const invitation = await this.invitationsRepository.findById(id);
        if (!invitation) throw new Error('Invitación no encontrada');

        invitation.expire();
        return this.invitationsRepository.save(invitation);
    }
}
