import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    NotFoundException,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { CreateOrganizationUseCase } from '@/modules/organizations/application/use-cases/create-organization.use-case';
import { UpdateOrganizationUseCase } from '@/modules/organizations/application/use-cases/update-organization.use-case';
import { GetOrganizationByIdUseCase } from '@/modules/organizations/application/use-cases/get-organization-by-id.use-case';
import { GetAllOrganizationsUseCase } from '@/modules/organizations/application/use-cases/get-all-organizations.use-case';
import { QuerySunatUseCase } from '@/modules/organizations/application/use-cases/query-sunat.use-case';
import { HttpCreateOrganizationDto } from '@/modules/organizations/infrastructure/http/dtos/create-organization.dto.http';
import { HttpUpdateOrganizationDto } from '@/modules/organizations/infrastructure/http/dtos/update-organization.dto.http';
import { OrganizationResponseDto } from '@/modules/organizations/infrastructure/http/dtos/organization-response.dto.http';
import { SunatCompanyResponseDto } from '@/modules/organizations/infrastructure/http/dtos/sunat-company-response.dto.http';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationController {
    constructor(
        private readonly createOrganizationUseCase: CreateOrganizationUseCase,
        private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
        private readonly getOrganizationByIdUseCase: GetOrganizationByIdUseCase,
        private readonly getAllOrganizationsUseCase: GetAllOrganizationsUseCase,
        private readonly querySunatUseCase: QuerySunatUseCase,
    ) {}

    @Post()
    async create(@Body() httpDto: HttpCreateOrganizationDto): Promise<OrganizationResponseDto> {
        const org = await this.createOrganizationUseCase.execute(httpDto);
        return new OrganizationResponseDto(org);
    }

    @Get()
    async findAll(): Promise<OrganizationResponseDto[]> {
        const orgs = await this.getAllOrganizationsUseCase.execute();
        return orgs.map((org) => new OrganizationResponseDto(org));
    }

    @Get('sunat/:query')
    async querySunat(@Param('query') query: string): Promise<SunatCompanyResponseDto | SunatCompanyResponseDto[]> {
        const result = await this.querySunatUseCase.execute(query);
        if (!result || (Array.isArray(result) && result.length === 0)) {
            throw new NotFoundException(
                'No se encontraron resultados en SUNAT para la organización consultada.',
            );
        }
        if (Array.isArray(result)) {
            return result.map((item) => new SunatCompanyResponseDto(item));
        }
        return new SunatCompanyResponseDto(result);
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<OrganizationResponseDto> {
        const org = await this.getOrganizationByIdUseCase.execute(id);
        if (!org) {
            throw new NotFoundException('Organización no encontrada');
        }
        return new OrganizationResponseDto(org);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() httpDto: HttpUpdateOrganizationDto,
    ): Promise<OrganizationResponseDto> {
        const org = await this.updateOrganizationUseCase.execute(id, httpDto);
        return new OrganizationResponseDto(org);
    }
}
