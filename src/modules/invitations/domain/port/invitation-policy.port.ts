import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';

export interface InvitationPolicyPort {
    isAllowedDomain(correo: string): boolean;
    isAllowedRole(role: UserRole): boolean;
    canCreateInvitation(actor: User): boolean;
}

export const INVITATION_POLICY = Symbol('INVITATION_POLICY');
