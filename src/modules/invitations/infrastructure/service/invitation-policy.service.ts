import { Injectable } from '@nestjs/common';
import { AllowedEmailDomainsConfig } from '@/shared/infrastructure/config/allowed-email-domains.config';
import { InvitationPolicyPort } from '@/modules/invitations/domain/port/invitation-policy.port';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';

@Injectable()
export class InvitationPolicyService implements InvitationPolicyPort {
    constructor(
        private readonly allowedEmailDomainsConfig: AllowedEmailDomainsConfig,
    ) {}

    isAllowedDomain(correo: string): boolean {
        const domain = correo.split('@')[1]?.toLowerCase() ?? '';
        return this.allowedEmailDomainsConfig
            .getAllowedDomains()
            .includes(domain);
    }

    isAllowedRole(role: UserRole): boolean {
        return role === UserRole.ADMINISTRADOR || role === UserRole.TRABAJADOR;
    }

    canCreateInvitation(actor: User): boolean {
        return actor.canAuthenticate() && actor.role === UserRole.ADMINISTRADOR;
    }
}
