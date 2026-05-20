import { Injectable } from '@shared/infrastructure/dependency-inyection/inyectable';
import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    INVITATIONS_REPOSITORY,
    type InvitationsRepositoryPort,
} from '@/modules/invitations/domain/port/invitations-repository.port';
import {
    INVITATION_POLICY,
    type InvitationPolicyPort,
} from '@/modules/invitations/domain/port/invitation-policy.port';
import { InvalidInvitationTokenException } from '@/modules/invitations/domain/exceptions/invalid-invitation-token.exception';
import { InvitationExpiredException } from '@/modules/invitations/domain/exceptions/invitation-expired.exception';
import { InvitationAlreadyAcceptedException } from '@/modules/invitations/domain/exceptions/invitation-already-accepted.exception';
import { InvalidInvitationDomainException } from '@/modules/invitations/domain/exceptions/invalid-invitation-domain.exception';

@Injectable()
export class AcceptInvitationUseCase {
    constructor(
        @Inject(INVITATIONS_REPOSITORY)
        private readonly invitationsRepository: InvitationsRepositoryPort,
        @Inject(INVITATION_POLICY)
        private readonly invitationPolicy: InvitationPolicyPort,
    ) {}

    async execute(input: { token: string; correo: string; password: string }) {
        const invitation = await this.invitationsRepository.findByToken(
            input.token,
        );

        if (!invitation) {
            throw new InvalidInvitationTokenException('Token inválido');
        }

        if (invitation.isExpired()) {
            throw new InvitationExpiredException('Token vencido');
        }

        if (invitation.isAccepted()) {
            throw new InvitationAlreadyAcceptedException('Token ya consumido');
        }

        if (!this.invitationPolicy.isAllowedDomain(input.correo)) {
            throw new InvalidInvitationDomainException('Dominio no permitido');
        }

        invitation.accept();
        return this.invitationsRepository.save(invitation);
    }
}
