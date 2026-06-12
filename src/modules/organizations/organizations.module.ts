import { Module } from '@nestjs/common';
import { ContactsModule } from '@/modules/contacts/contacts.module';
import { OrganizationController } from './infrastructure/http/organization.controller';
import { PrismaOrganizationRepository } from './infrastructure/persistance/prisma-organization.repository';
import { SunatWebScraperAdapter } from './infrastructure/service/sunat-web-scraper.adapter';
import { ORGANIZATION_REPOSITORY } from './domain/ports/organization.repository';
import { SUNAT_SERVICE } from './domain/ports/sunat.service';
import { CreateOrganizationUseCase } from './application/use-cases/create-organization.use-case';
import { UpdateOrganizationUseCase } from './application/use-cases/update-organization.use-case';
import { GetOrganizationByIdUseCase } from './application/use-cases/get-organization-by-id.use-case';
import { GetAllOrganizationsUseCase } from './application/use-cases/get-all-organizations.use-case';
import { QuerySunatUseCase } from './application/use-cases/query-sunat.use-case';
import { DeleteOrganizationUseCase } from './application/use-cases/delete-organization.use-case';

@Module({
    imports: [ContactsModule],
    controllers: [OrganizationController],
    providers: [
        PrismaOrganizationRepository,
        SunatWebScraperAdapter,
        {
            provide: ORGANIZATION_REPOSITORY,
            useExisting: PrismaOrganizationRepository,
        },
        {
            provide: SUNAT_SERVICE,
            useExisting: SunatWebScraperAdapter,
        },
        CreateOrganizationUseCase,
        UpdateOrganizationUseCase,
        GetOrganizationByIdUseCase,
        GetAllOrganizationsUseCase,
        QuerySunatUseCase,
        DeleteOrganizationUseCase,
    ],
    exports: [
        ORGANIZATION_REPOSITORY,
        SUNAT_SERVICE,
        CreateOrganizationUseCase,
        UpdateOrganizationUseCase,
        GetOrganizationByIdUseCase,
        GetAllOrganizationsUseCase,
        QuerySunatUseCase,
        DeleteOrganizationUseCase,
    ],
})
export class OrganizationsModule {}
