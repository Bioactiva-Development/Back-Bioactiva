import { Controller, Get, Post, Patch, Body, Param, NotFoundException } from '@nestjs/common';
import {
    CreateOrganizationUseCase,
    UpdateOrganizationUseCase,
    GetOrganizationByIdUseCase,
    GetAllOrganizationsUseCase,
    QuerySunatUseCase,
} from '../../application/use-cases';
import { HttpCreateOrganizationDto } from './dto/http-create-organization.dto';
import { HttpUpdateOrganizationDto } from './dto/http-update-organization.dto';

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
            throw new NotFoundException('No se encontraron resultados en SUNAT para la organización consultada.');
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
