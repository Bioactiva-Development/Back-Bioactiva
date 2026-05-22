import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import {
    CreateOrganizationUseCase,
    UpdateOrganizationUseCase,
    GetOrganizationByIdUseCase,
    GetAllOrganizationsUseCase,
} from '../../application/use-cases';
import { HttpCreateOrganizationDto } from '../web/requests/http-create-organization.dto';
import { HttpUpdateOrganizationDto } from '../web/requests/http-update-organization.dto';

@Controller('organizations')
export class OrganizationController {
    constructor(
        private readonly createOrganizationUseCase: CreateOrganizationUseCase,
        private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
        private readonly getOrganizationByIdUseCase: GetOrganizationByIdUseCase,
        private readonly getAllOrganizationsUseCase: GetAllOrganizationsUseCase,
    ) {}

    @Post()
    async create(@Body() httpDto: HttpCreateOrganizationDto) {
        return await this.createOrganizationUseCase.execute(httpDto);
    }

    @Get()
    async findAll() {
        return await this.getAllOrganizationsUseCase.execute();
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
