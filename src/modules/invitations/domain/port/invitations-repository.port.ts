import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { InvitationToken } from '@modules/invitations/domain/entities/invitation_token';

export interface InvitationsRepositoryPort {
    list(
        page?: number | null,
        limit?: number,
        term?: string,
        estado?: TokenStatus | null,
    ): Promise<InvitationToken[]>;
    findById(id: string): Promise<InvitationToken | null>;
    findByToken(token: string): Promise<InvitationToken | null>;
    findPendingByEmail(correo: string): Promise<InvitationToken | null>;
    save(invitation: InvitationToken): Promise<InvitationToken>;
}

export const INVITATIONS_REPOSITORY = Symbol('INVITATIONS_REPOSITORY');
