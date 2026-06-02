import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    type InvitationsRepositoryPort,
    INVITATIONS_REPOSITORY,
} from '@/modules/invitations/domain/port/invitations-repository.port';
import { InvitationInfoDto } from '@/modules/invitations/application/dto/invitation-info.dto';
import { HashServicePort } from '@/shared/domain/ports/hash-service.port';
import { InvitationNotFoundException } from '@/modules/invitations/domain/exceptions/invitation-not-found.exception';

export class ObtainInfoUseCase {
    constructor(
        @Inject(INVITATIONS_REPOSITORY)
        private readonly invitationsRepository: InvitationsRepositoryPort,
        @Inject(HashServicePort)
        private readonly hashService: HashServicePort,
    ) {}

    async execute(token: string): Promise<InvitationInfoDto> {
        const token_hash = this.hashService.hash(token);
        const invitation =
            await this.invitationsRepository.findByToken(token_hash);
        if (!invitation) {
            throw new InvitationNotFoundException('Token no encontrado');
        }
        let correo = invitation.correo;
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
