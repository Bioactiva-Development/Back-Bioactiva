import { Module } from '@nestjs/common';
import { OrganizationController } from './infrastructure/http/organization.controller';
import { PrismaOrganizationRepository } from './infrastructure/persistance/prisma-organization.repository';
import { SunatWebScraperAdapter } from './infrastructure/service/sunat-web-scraper.adapter';
import { IOrganizationRepository } from './domain/ports/organization.repository';
import { ISunatService } from './domain/ports/sunat.service';
import {
    CreateOrganizationUseCase,
    UpdateOrganizationUseCase,
    GetOrganizationByIdUseCase,
    GetAllOrganizationsUseCase,
    QuerySunatUseCase,
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
        QuerySunatUseCase,
    ],
    exports: [
        IOrganizationRepository,
        ISunatService,
        CreateOrganizationUseCase,
        UpdateOrganizationUseCase,
        GetOrganizationByIdUseCase,
        GetAllOrganizationsUseCase,
        QuerySunatUseCase,
    ],
})
export class OrganizationsModule {}
