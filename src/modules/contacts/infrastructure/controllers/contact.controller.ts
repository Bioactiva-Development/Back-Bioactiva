import { Controller, Post, Body, Get, Param, Patch, ParseIntPipe, UseGuards } from '@nestjs/common';
import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiBearerAuth 
} from '@nestjs/swagger';
import { 
    CreateContactUseCase, 
    UpdateContactUseCase, 
    GetContactByIdUseCase, 
    GetAllContactsUseCase, 
    GetContactsByOrganizationUseCase 
 } from '@/modules/contacts/application/use-cases';
import { HttpCreateContactDto } from '@/modules/contacts/infrastructure/web/requests/http-create-contact.dto';
import { HttpUpdateContactDto } from '@/modules/contacts/infrastructure/web/requests/http-update-contact.dto';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { User } from '@/modules/users/domain/entities/user';
import { CreateContactDto } from '@/modules/contacts/application/dtos/create-contact.dto';

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactController {
    constructor(
        private readonly createContactUseCase: CreateContactUseCase,
        private readonly updateContactUseCase: UpdateContactUseCase,
        private readonly getContactByIdUseCase: GetContactByIdUseCase,
        private readonly getAllContactsUseCase: GetAllContactsUseCase,
        private readonly getContactsByOrgUseCase: GetContactsByOrganizationUseCase
    ) {}

    @Post()
    @ApiOperation({ summary: 'Registrar un nuevo contacto' })
    @ApiResponse({ status: 201, description: 'Contacto creado exitosamente' })
    @ApiResponse({ status: 409, description: 'El correo electrónico ya existe' })
    async create(
        @Body() httpDto: HttpCreateContactDto,
        @CurrentUser() user: User
    ) {
        const createDto = new CreateContactDto(
            httpDto.nombres,
            httpDto.apellidos,
            httpDto.vocativo,
            httpDto.cargo,
            httpDto.correo,
            httpDto.telefono,
            httpDto.correo2,
            httpDto.comentarios,
            httpDto.idOrganizacion,
            user.id!
        );
        return await this.createContactUseCase.execute(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos los contactos' })
    @ApiResponse({ status: 200, description: 'Listado de contactos obtenido' })
    async findAll() {
        return await this.getAllContactsUseCase.execute();
    }

    @Get('organization/:idOrganizacion')
    @ApiOperation({ summary: 'Consultar contactos por organización' })
    @ApiResponse({ status: 200, description: 'Listado de contactos por organización obtenido' })
    async findByOrganization(@Param('idOrganizacion') idOrganizacion: string) {
        return await this.getContactsByOrgUseCase.execute(idOrganizacion);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Consultar detalle de un contacto por ID' })
    @ApiResponse({ status: 200, description: 'Detalle del contacto obtenido' })
    @ApiResponse({ status: 404, description: 'Contacto no encontrado' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return await this.getContactByIdUseCase.execute(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar un contacto existente' })
    @ApiResponse({ status: 200, description: 'Contacto actualizado exitosamente' })
    @ApiResponse({ status: 404, description: 'Contacto no encontrado' })
    async update(
        @Param('id', ParseIntPipe) id: number, 
        @Body() httpDto: HttpUpdateContactDto
    ) {
        // En el update, no solemos cambiar el autor original, 
        // pero si fuera necesario auditar quién editó, se pasaría el user.id aquí.
        return await this.updateContactUseCase.execute(id, httpDto);
    }
}