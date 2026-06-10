import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    INVITATIONS_REPOSITORY,
    type InvitationsRepositoryPort,
} from '@/modules/invitations/domain/port/invitations-repository.port';
import { DeactivateInvitedUserService } from '@/modules/invitations/application/services/deactivate-invited-user.service';

export class ExpireOverdueInvitationsUseCase {
    constructor(
        @Inject(INVITATIONS_REPOSITORY)
        private readonly invitationsRepository: InvitationsRepositoryPort,
        private readonly deactivateInvitedUser: DeactivateInvitedUserService,
    ) {}

    async execute(now: Date = new Date()): Promise<number> {
        const overdueInvitations =
            await this.invitationsRepository.findPendingExpired(now);

        if (overdueInvitations.length === 0) {
            return 0;
        }

        // Expira todas las invitaciones en una sola operación (antes: un UPDATE
        // por invitación).
        const expiredCount = await this.invitationsRepository.expireAllPending(
            overdueInvitations.map((invitation) => invitation.id!),
        );

        // Desactiva en bloque los usuarios provisionales asociados (antes: una
        // lectura + escritura por correo).
        await this.deactivateInvitedUser.executeMany(
            overdueInvitations.map((invitation) => invitation.correo),
        );

        return expiredCount;
    }
}
