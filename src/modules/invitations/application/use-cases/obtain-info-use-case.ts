import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    type InvitationsRepositoryPort,
    INVITATIONS_REPOSITORY,
} from '@/modules/invitations/domain/port/invitations-repository.port';
import { InvitationInfoDto } from '@/modules/invitations/application/dto/invitation-info.dto';
import { HashServicePort } from '@/shared/domain/ports/hash-service.port';
import { InvitationNotFoundException } from '@/modules/invitations/domain/exceptions/invitation-not-found.exception';
import { maskEmail } from '@/shared/domain/utils/mask-email';

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
        return {
            correo: maskEmail(invitation.correo),
            expired: invitation.isExpired(),
            accepted: invitation.isAccepted(),
        };
    }
}
