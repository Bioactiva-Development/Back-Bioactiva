import { Injectable } from '@shared/infrastructure/dependency-inyection/inyectable';
import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    INVITATIONS_REPOSITORY,
    type InvitationsRepositoryPort,
} from '@/modules/invitations/domain/port/invitations-repository.port';
import { InvitationNotFoundException } from '@/modules/invitations/domain/exceptions/invitation-not-found.exception';

@Injectable()
export class RevokeInvitationUseCase {
    constructor(
        @Inject(INVITATIONS_REPOSITORY)
        private readonly invitationsRepository: InvitationsRepositoryPort,
    ) {}

    async execute(id: number) {
        const invitation = await this.invitationsRepository.findById(id);
        if (!invitation)
            throw new InvitationNotFoundException('Invitación no encontrada');

        invitation.revoke();
        return this.invitationsRepository.save(invitation);
    }
}
