import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { InvitationToken } from '@modules/invitations/domain/entities/invitation_token';

export interface InvitationsRepositoryPort {
    list(
        page?: number,
        limit?: number,
        term?: string,
        estado?: TokenStatus,
    ): Promise<InvitationToken[]>;
    findPendingExpired(before: Date): Promise<InvitationToken[]>;
    findById(id: number): Promise<InvitationToken | null>;
    findByToken(token: string): Promise<InvitationToken | null>;
    findPendingByEmail(correo: string): Promise<InvitationToken | null>;
    save(invitation: InvitationToken): Promise<InvitationToken>;
}

export const INVITATIONS_REPOSITORY = Symbol('INVITATIONS_REPOSITORY');
