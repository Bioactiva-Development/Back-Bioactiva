import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    type InvitationsRepositoryPort,
    INVITATIONS_REPOSITORY,
} from '@/modules/invitations/domain/port/invitations-repository.port';
import { InvitationInfoDto } from '@/modules/invitations/application/dto/invitation-info.dto';

export class ObtainInfoUseCase {
    constructor(
        @Inject(INVITATIONS_REPOSITORY)
        private readonly invitationsRepository: InvitationsRepositoryPort,
    ) {}

    async execute(token: string): Promise<InvitationInfoDto> {
        const invitation = await this.invitationsRepository.findByToken(token);
        if (!invitation) {
            throw new Error('Token no encontrado');
        }
        let correo = invitation.correo;
        // We have to mask a part of the email for security reasons
        const [localPart, domain] = correo.split('@');
        const maskedLocalPart =
            localPart.length <= 2
                ? localPart[0] + '*'.repeat(localPart.length - 1)
                : localPart[0] +
                  '*'.repeat(localPart.length - 2) +
                  localPart.slice(-1);
        correo = maskedLocalPart + '@' + domain;
        return {
            correo,
            expired: invitation.isExpired(),
            accepted: invitation.isAccepted(),
        };
    }
}
