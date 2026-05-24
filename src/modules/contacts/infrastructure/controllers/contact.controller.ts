import { Controller, Post, Body, Get, Param, Patch, ParseIntPipe } from '@nestjs/common';
import { 
    CreateContactUseCase, 
    UpdateContactUseCase, 
    GetContactByIdUseCase, 
    GetAllContactsUseCase, 
    GetContactsByOrganizationUseCase 
 } from '../../application/use-cases';
import { HttpCreateContactDto } from '../web/requests/http-create-contact.dto';
import { HttpUpdateContactDto } from '../web/requests/http-update-contact.dto'; // (Debes crear este DTO, similar al Create pero con todo @IsOptional())

@Controller('contacts')
export class ContactController {
    constructor(
        private readonly createContactUseCase: CreateContactUseCase,
        private readonly updateContactUseCase: UpdateContactUseCase,
        private readonly getContactByIdUseCase: GetContactByIdUseCase,
        private readonly getAllContactsUseCase: GetAllContactsUseCase,
        private readonly getContactsByOrgUseCase: GetContactsByOrganizationUseCase
    ) {}

    // 1. REGISTRAR
    @Post()
    async create(@Body() httpDto: HttpCreateContactDto) {
        return await this.createContactUseCase.execute(httpDto);
    }

    // 2. LISTAR TODOS
    @Get()
    async findAll() {
        return await this.getAllContactsUseCase.execute();
    }

    // 3. CONSULTAR POR ORGANIZACIÓN
    // Ruta: GET /contacts/organization/123e4567-e89b-12d3...
    @Get('organization/:idOrganizacion')
    async findByOrganization(@Param('idOrganizacion') idOrganizacion: string) {
        return await this.getContactsByOrgUseCase.execute(idOrganizacion);
    }

    // 4. CONSULTAR DETALLE POR ID
    // Ruta: GET /contacts/5
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return await this.getContactByIdUseCase.execute(id);
    }

    // 5. EDITAR
    // Ruta: PATCH /contacts/5
    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number, 
        @Body() httpDto: HttpUpdateContactDto
    ) {
        return await this.updateContactUseCase.execute(id, httpDto);
    }
}