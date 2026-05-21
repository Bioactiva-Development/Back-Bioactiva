import { randomUUID } from 'node:crypto';
import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    INVITATIONS_REPOSITORY,
    type InvitationsRepositoryPort,
} from '@/modules/invitations/domain/port/invitations-repository.port';
import {
    INVITATION_POLICY,
    type InvitationPolicyPort,
} from '@/modules/invitations/domain/port/invitation-policy.port';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { NotAuthorizedException } from '@/modules/auth/domain/exceptions/not-authorized.exeption';
import { InvalidInvitationDomainException } from '@/modules/invitations/domain/exceptions/invalid-invitation-domain.exception';
import { InvitationToken } from '@/modules/invitations/domain/entities/invitation_token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { HashServicePort } from '@/shared/domain/ports/hash-service.port';
import {
    INVITATION_NOTIFICATION_PORT,
    type InvitationNotificationPort,
} from '@/modules/invitations/domain/port/invitation-notification.port';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import { UserState } from '@/modules/users/domain/enums/estado';

export class CreateInvitationUseCase {
    constructor(
        @Inject(INVITATIONS_REPOSITORY)
        private readonly invitationsRepository: InvitationsRepositoryPort,
        @Inject(INVITATION_POLICY)
        private readonly invitationPolicy: InvitationPolicyPort,
        @Inject(HashServicePort)
        private readonly hashService: HashServicePort,
        @Inject(INVITATION_NOTIFICATION_PORT)
        private readonly invitationNotification: InvitationNotificationPort,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(
        actor: User,
        correo: string,
        rol: UserRole,
    ): Promise<{ invitation: InvitationToken; token: string }> {
        if (!this.invitationPolicy.canCreateInvitation(actor)) {
            throw new NotAuthorizedException('No autorizado');
        }

        if (!this.invitationPolicy.isAllowedDomain(correo)) {
            throw new InvalidInvitationDomainException('Dominio no permitido');
        }

        const existing =
            await this.invitationsRepository.findPendingByEmail(correo);
        if (existing) {
            throw new InvalidInvitationDomainException(
                'Ya existe una invitación pendiente',
            );
        }

        const token = randomUUID();
        const tokenHash = this.hashService.hash(token);
        if (actor.id === null) {
            throw new NotAuthorizedException('Usuario no válido');
        }
        const invitation = new InvitationToken(
            null,
            correo,
            tokenHash,
            rol,
            actor.id,
            TokenStatus.PENDIENTE,
            new Date(),
            null,
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        );
        const newUser = new User(
            null,
            '',
            '',
            correo,
            '',
            new Date(),
            rol,
            UserState.PENDIENTE,
            new Date(),
        );
        await this.userRepository.save(newUser);
        const savedInvitation =
            await this.invitationsRepository.save(invitation);
        await this.invitationNotification.enqueueInvitationEmail({
            correo: correo,
            token,
            rol: rol,
            invitedBy: actor.id,
        });
        return {
            invitation: savedInvitation,
            token,
        };
    }
}
