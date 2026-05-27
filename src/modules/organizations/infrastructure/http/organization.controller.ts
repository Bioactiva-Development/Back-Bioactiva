import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    NotFoundException,
} from '@nestjs/common';
import { CreateOrganizationUseCase } from '@/modules/organizations/application/use-cases/create-organization.use-case';
import { UpdateOrganizationUseCase } from '@/modules/organizations/application/use-cases/update-organization.use-case';
import { GetOrganizationByIdUseCase } from '@/modules/organizations/application/use-cases/get-organization-by-id.use-case';
import { GetAllOrganizationsUseCase } from '@/modules/organizations/application/use-cases/get-all-organizations.use-case';
import { QuerySunatUseCase } from '@/modules/organizations/application/use-cases/query-sunat.use-case';
import { HttpCreateOrganizationDto } from '@/modules/organizations/infrastructure/http/dtos/create-organization.dto.http';
import { HttpUpdateOrganizationDto } from '@/modules/organizations/infrastructure/http/dtos/update-organization.dto.http';

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
    async create(@Body() httpDto: HttpCreateOrganizationDto) {
        return await this.createOrganizationUseCase.execute(httpDto);
    }

    @Get()
    async findAll() {
        return await this.getAllOrganizationsUseCase.execute();
    }

    @Get('sunat/:query')
    async querySunat(@Param('query') query: string) {
        const result = await this.querySunatUseCase.execute(query);
        if (!result || (Array.isArray(result) && result.length === 0)) {
            throw new NotFoundException(
                'No se encontraron resultados en SUNAT para la organización consultada.',
            );
        }
        return result;
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.getOrganizationByIdUseCase.execute(id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() httpDto: HttpUpdateOrganizationDto,
    ) {
        return await this.updateOrganizationUseCase.execute(id, httpDto);
    }
}
