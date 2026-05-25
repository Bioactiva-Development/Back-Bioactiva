import { Module } from '@nestjs/common';
import { OrganizationController } from './infrastructure/controllers/organization.controller';
import { PrismaOrganizationRepository } from './infrastructure/persistence/prisma-organization.repository';
import { SunatWebScraperAdapter } from './infrastructure/external-services/sunat-web-scraper.adapter';
import { IOrganizationRepository } from './domain/ports/organization.repository';
import { ISunatService } from './domain/ports/sunat.service';
import {
    CreateOrganizationUseCase,
    UpdateOrganizationUseCase,
    GetOrganizationByIdUseCase,
    GetAllOrganizationsUseCase,
} from './application/use-cases';

@Module({
    controllers: [OrganizationController],
    providers: [
        PrismaOrganizationRepository,
        SunatWebScraperAdapter,
        {
            provide: IOrganizationRepository,
            useExisting: PrismaOrganizationRepository,
        },
        {
            provide: ISunatService,
            useExisting: SunatWebScraperAdapter,
        },
        CreateOrganizationUseCase,
        UpdateOrganizationUseCase,
        GetOrganizationByIdUseCase,
        GetAllOrganizationsUseCase,
    ],
    exports: [
        IOrganizationRepository,
        ISunatService,
        CreateOrganizationUseCase,
        UpdateOrganizationUseCase,
        GetOrganizationByIdUseCase,
        GetAllOrganizationsUseCase,
    ],
})
export class OrganizationsModule {}
