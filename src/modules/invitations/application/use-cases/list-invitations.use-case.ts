import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    INVITATIONS_REPOSITORY,
    type InvitationsRepositoryPort,
} from '@/modules/invitations/domain/port/invitations-repository.port';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

export class ListInvitationsUseCase {
    constructor(
        @Inject(INVITATIONS_REPOSITORY)
        private readonly invitationsRepository: InvitationsRepositoryPort,
    ) {}

    async execute(
        page?: number,
        limit?: number,
        term?: string,
        estado?: TokenStatus,
    ) {
        const [data, total] = await Promise.all([
            this.invitationsRepository.list(page, limit, term, estado),
            this.invitationsRepository.count(term, estado),
        ]);
        return { data, total };
    }
}
