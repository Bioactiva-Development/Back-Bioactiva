import { AuthModule } from '@/modules/auth/auth.module';
import { PrismaModule } from '@/modules/common/prisma/prisma.module';
import { AcceptInvitationUseCase } from '@/modules/invitations/application/use-cases/accept-invitation.use-case';
import { CreateInvitationUseCase } from '@/modules/invitations/application/use-cases/create-invitation.use-case';
import { ExpireInvitationUseCase } from '@/modules/invitations/application/use-cases/expire-invitation.use-case';
import { ListInvitationsUseCase } from '@/modules/invitations/application/use-cases/list-invitations.use-case';
import { ObtainInfoUseCase } from '@/modules/invitations/application/use-cases/obtain-info-use-case';
import { RevokeInvitationUseCase } from '@/modules/invitations/application/use-cases/revoke-invitation.use-case';
import { INVITATION_NOTIFICATION_PORT } from '@/modules/invitations/domain/port/invitation-notification.port';
import { INVITATION_EXPIRATION_SCHEDULER_PORT } from '@/modules/invitations/domain/port/invitation-expiration-scheduler.port';
import { INVITATION_POLICY } from '@/modules/invitations/domain/port/invitation-policy.port';
import { INVITATIONS_REPOSITORY } from '@/modules/invitations/domain/port/invitations-repository.port';
import { InvitationController } from '@/modules/invitations/infrastructure/http/invitation.controller';
import { InvitationEmailQueueModule } from '@/modules/invitations/infrastructure/queue/invitation-email.module';
import { PrismaInvitationsRepository } from '@/modules/invitations/infrastructure/persistance/prisma-invitation.repository';
import { InvitationPolicyService } from '@/modules/invitations/infrastructure/service/invitation-policy.service';
import { UsersModule } from '@/modules/users/user.module';
import { AllowedEmailDomainsConfig } from '@/shared/infrastructure/config/allowed-email-domains.config';
import { HashServicePort } from '@/shared/domain/ports/hash-service.port';
import { Sha256HashService } from '@/shared/infrastructure/service/sha256-hash.service';
import { Module } from '@nestjs/common';
import { InvitationEmailPublisher } from './infrastructure/queue/invitation-email.publisher';
import { InvitationExpirationPublisher } from './infrastructure/queue/invitation-expiration.publisher';

@Module({
    imports: [
        AuthModule,
        UsersModule,
        InvitationEmailQueueModule,
        PrismaModule,
    ],
    providers: [
        AcceptInvitationUseCase,
        CreateInvitationUseCase,
        ExpireInvitationUseCase,
        ListInvitationsUseCase,
        ObtainInfoUseCase,
        RevokeInvitationUseCase,
        PrismaInvitationsRepository,
        InvitationPolicyService,
        AllowedEmailDomainsConfig,
        Sha256HashService,
        {
            provide: INVITATIONS_REPOSITORY,
            useExisting: PrismaInvitationsRepository,
        },
        {
            provide: INVITATION_POLICY,
            useExisting: InvitationPolicyService,
        },
        {
            provide: INVITATION_NOTIFICATION_PORT,
            useExisting: InvitationEmailPublisher,
        },
        {
            provide: INVITATION_EXPIRATION_SCHEDULER_PORT,
            useExisting: InvitationExpirationPublisher,
        },
        {
            provide: HashServicePort,
            useExisting: Sha256HashService,
        },
    ],
    controllers: [InvitationController],
})
export class InvitationsModule {}
