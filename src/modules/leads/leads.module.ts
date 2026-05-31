import { Module } from '@nestjs/common';
import { PrismaModule } from '@/modules/common/prisma/prisma.module';
import { LeadController } from '@/modules/leads/infrastructure/http/lead.controller';
import { PrismaLeadRepository } from '@/modules/leads/infrastructure/persistance/prisma-lead.repository';
import { LEAD_REPOSITORY } from '@/modules/leads/domain/ports/lead-repository.port';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { ContactsModule } from '@/modules/contacts/contacts.module';
import { UsersModule } from '@/modules/users/user.module';
import { CreateLeadUseCase } from '@/modules/leads/application/use-cases/create-lead.use-case';
import { GetLeadByIdUseCase } from '@/modules/leads/application/use-cases/get-lead-by-id.use-case';
import { ListLeadsUseCase } from '@/modules/leads/application/use-cases/list-leads.use-case';
import { UpdateLeadUseCase } from '@/modules/leads/application/use-cases/update-lead.use-case';
import { ChangeLeadStatusUseCase } from '@/modules/leads/application/use-cases/change-lead-status.use-case';
import { DeleteLeadUseCase } from '@/modules/leads/application/use-cases/delete-lead.use-case';

@Module({
    imports: [PrismaModule, OrganizationsModule, ContactsModule, UsersModule],
    controllers: [LeadController],
    providers: [
        PrismaLeadRepository,
        {
            provide: LEAD_REPOSITORY,
            useExisting: PrismaLeadRepository,
        },
        CreateLeadUseCase,
        GetLeadByIdUseCase,
        ListLeadsUseCase,
        UpdateLeadUseCase,
        ChangeLeadStatusUseCase,
        DeleteLeadUseCase,
    ],
    exports: [LEAD_REPOSITORY],
})
export class LeadsModule {}
