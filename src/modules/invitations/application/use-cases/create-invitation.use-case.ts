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
import { UserAlreadyRegisteredException } from '@/modules/invitations/domain/exceptions/user-already-registered.exception';
import { InvitationToken } from '@/modules/invitations/domain/entities/invitation_token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { HashServicePort } from '@/shared/domain/ports/hash-service.port';
import {
    INVITATION_NOTIFICATION_PORT,
    type InvitationNotificationPort,
} from '@/modules/invitations/domain/port/invitation-notification.port';
import {
    INVITATION_EXPIRATION_SCHEDULER_PORT,
    type InvitationExpirationSchedulerPort,
} from '@/modules/invitations/domain/port/invitation-expiration-scheduler.port';
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
        @Inject(INVITATION_EXPIRATION_SCHEDULER_PORT)
        private readonly invitationExpirationScheduler: InvitationExpirationSchedulerPort,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(
        actor: User,
        correo: string,
        rol: UserRole,
    ): Promise<{ ok: boolean }> {
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

        const existingUser = await this.userRepository.findByCorreo(correo);
        if (existingUser && !existingUser.isProvisional()) {
            throw new UserAlreadyRegisteredException(
                'Ya existe un usuario registrado con este correo',
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
        // Reutiliza al usuario provisional huérfano de una invitación previa
        // (cancelada/expirada) en vez de recrearlo, evitando violar el unique
        // de correo. Lo restaura a PENDIENTE con el rol de la nueva invitación.
        const provisionalUser = new User(
            existingUser?.id ?? null,
            existingUser?.nombres ?? '',
            existingUser?.apellidos ?? '',
            correo,
            '',
            existingUser?.created_at ?? new Date(),
            rol,
            UserState.PENDIENTE,
            new Date(),
        );
        await this.userRepository.save(provisionalUser);
        await this.invitationsRepository.save(invitation);
        await this.invitationExpirationScheduler.scheduleExpiration({
            invitationId: invitation.id!,
            expiresAt: invitation.expired_at,
        });
        await this.invitationNotification.enqueueInvitationEmail({
            correo: correo,
            token,
            rol: rol,
            invitedBy: actor.id,
        });
        return {
            ok: true,
        };
    }
}
