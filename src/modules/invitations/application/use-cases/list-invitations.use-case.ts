import { Injectable } from '@shared/infrastructure/dependency-inyection/inyectable';
import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    INVITATIONS_REPOSITORY,
    type InvitationsRepositoryPort,
} from '@/modules/invitations/domain/port/invitations-repository.port';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

@Injectable()
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
        return await this.invitationsRepository.list(page, limit, term, estado);
    }
}
