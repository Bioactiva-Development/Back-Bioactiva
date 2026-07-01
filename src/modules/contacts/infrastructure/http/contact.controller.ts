import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    Patch,
    Query,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateContactUseCase } from '@/modules/contacts/application/use-cases/create-contact.use-case';
import { UpdateContactUseCase } from '@/modules/contacts/application/use-cases/update-contact.use-case';
import { ChangeContactStatusUseCase } from '@/modules/contacts/application/use-cases/change-contact-status.use-case';
import { GetContactByIdUseCase } from '@/modules/contacts/application/use-cases/get-contact-by-id.use-case';
import { GetAllContactsUseCase } from '@/modules/contacts/application/use-cases/get-all-contacts.use-case';
import { GetContactsByOrganizationUseCase } from '@/modules/contacts/application/use-cases/get-contacts-by-organization.use-case';
import { HttpCreateContactDto } from '@/modules/contacts/infrastructure/http/dtos/create-contact.dto.http';
import { HttpUpdateContactDto } from '@/modules/contacts/infrastructure/http/dtos/update-contact.dto.http';
import { HttpChangeContactStatusDto } from '@/modules/contacts/infrastructure/http/dtos/change-contact-status.dto.http';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { User } from '@/modules/users/domain/entities/user';
import { CreateContactDto } from '@/modules/contacts/application/dtos/create-contact.dto';
import { ListContactsDto } from '@/modules/contacts/application/dtos/list-contacts.dto';
import { ContactResponseDto } from '@/modules/contacts/infrastructure/http/dtos/contact-response.dto';
import { HttpListContactsQueryDto } from '@/modules/contacts/infrastructure/http/dtos/list-contacts-query.dto.http';
import { PaginatedContactResponseDto } from '@/modules/contacts/infrastructure/http/dtos/paginated-contact-response.dto';

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
        private readonly getContactsByOrgUseCase: GetContactsByOrganizationUseCase,
        private readonly changeContactStatusUseCase: ChangeContactStatusUseCase,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Registrar un nuevo contacto' })
    @ApiResponse({
        status: 201,
        description: 'Contacto creado exitosamente',
        type: ContactResponseDto,
    })
    @ApiResponse({
        status: 409,
        description: 'El correo electrónico ya existe',
    })
    async create(
        @Body() httpDto: HttpCreateContactDto,
        @CurrentUser() user: User,
    ): Promise<ContactResponseDto> {
        const createDto = new CreateContactDto(
            httpDto.nombres,
            httpDto.apellidos ?? null,
            httpDto.vocativo ?? null,
            httpDto.cargo ?? null,
            httpDto.correo,
            httpDto.telefono ?? null,
            httpDto.correo2 ?? null,
            httpDto.comentarios ?? null,
            httpDto.idOrganizacion,
            user.id!,
        );
        const enriched = await this.createContactUseCase.execute(createDto);
        return new ContactResponseDto(enriched);
    }

    @Get()
    @ApiOperation({
        summary: 'Listar contactos con filtros y paginación',
    })
    @ApiResponse({
        status: 200,
        description: 'Listado paginado de contactos obtenido',
        type: PaginatedContactResponseDto,
    })
    async findAll(
        @Query() query: HttpListContactsQueryDto,
    ): Promise<PaginatedContactResponseDto> {
        const dto = new ListContactsDto(query.search, query.page, query.limit, query.idOrganization);
        const { data, total } = await this.getAllContactsUseCase.execute(dto);
        const responseData = data.map((r) => new ContactResponseDto(r));
        return new PaginatedContactResponseDto(
            responseData,
            total,
            dto.page,
            dto.limit,
        );
    }

    @Get('organization/:idOrganizacion')
    @ApiOperation({ summary: 'Consultar contactos por organización' })
    @ApiResponse({
        status: 200,
        description: 'Listado de contactos por organización obtenido',
        type: [ContactResponseDto],
    })
    async findByOrganization(
        @Param('idOrganizacion') idOrganizacion: string,
    ): Promise<ContactResponseDto[]> {
        const result =
            await this.getContactsByOrgUseCase.execute(idOrganizacion);
        return result.map((r) => new ContactResponseDto(r));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Consultar detalle de un contacto por ID' })
    @ApiResponse({
        status: 200,
        description: 'Detalle del contacto obtenido',
        type: ContactResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Contacto no encontrado' })
    async findOne(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<ContactResponseDto> {
        const enriched = await this.getContactByIdUseCase.execute(id);
        return new ContactResponseDto(enriched);
    }

    @Patch(':id/status')
    @ApiOperation({
        summary: 'Cambiar el estado de un contacto (VIGENTE / VENCIDO)',
    })
    @ApiResponse({
        status: 200,
        description: 'Estado del contacto actualizado exitosamente',
        type: ContactResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Contacto no encontrado' })
    async changeStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() httpDto: HttpChangeContactStatusDto,
    ): Promise<ContactResponseDto> {
        const enriched = await this.changeContactStatusUseCase.execute(
            id,
            httpDto.estado_correo,
        );
        return new ContactResponseDto(enriched);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar un contacto existente' })
    @ApiResponse({
        status: 200,
        description: 'Contacto actualizado exitosamente',
        type: ContactResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Contacto no encontrado' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() httpDto: HttpUpdateContactDto,
    ): Promise<ContactResponseDto> {
        const enriched = await this.updateContactUseCase.execute(id, httpDto);
        return new ContactResponseDto(enriched);
    }
}
