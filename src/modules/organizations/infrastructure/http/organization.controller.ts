import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    NotFoundException,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { CreateOrganizationUseCase } from '@/modules/organizations/application/use-cases/create-organization.use-case';
import { UpdateOrganizationUseCase } from '@/modules/organizations/application/use-cases/update-organization.use-case';
import { GetOrganizationByIdUseCase } from '@/modules/organizations/application/use-cases/get-organization-by-id.use-case';
import { GetAllOrganizationsUseCase } from '@/modules/organizations/application/use-cases/get-all-organizations.use-case';
import { QuerySunatUseCase } from '@/modules/organizations/application/use-cases/query-sunat.use-case';
import { DeleteOrganizationUseCase } from '@/modules/organizations/application/use-cases/delete-organization.use-case';
import { HttpCreateOrganizationDto } from '@/modules/organizations/infrastructure/http/dtos/create-organization.dto.http';
import { HttpUpdateOrganizationDto } from '@/modules/organizations/infrastructure/http/dtos/update-organization.dto.http';
import { OrganizationResponseDto } from '@/modules/organizations/infrastructure/http/dtos/organization-response.dto.http';
import { PaginatedOrganizationResponseDto } from '@/modules/organizations/infrastructure/http/dtos/paginated-organization-response.dto.http';
import { ListOrganizationsQueryDto } from '@/modules/organizations/infrastructure/http/dtos/list-organizations-query.dto.http';
import { ListOrganizationsDto } from '@/modules/organizations/application/dto/list-organizations.dto';
import { OrganizationDetailResponseDto } from '@/modules/organizations/infrastructure/http/dtos/organization-detail-response.dto.http';
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
        private readonly deleteOrganizationUseCase: DeleteOrganizationUseCase,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Registrar una nueva organización' })
    @ApiResponse({
        status: 201,
        description: 'Organización creada exitosamente',
        type: OrganizationResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Datos inválidos',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 409,
        description: 'El código de cliente o el RUC ya existen',
    })
    async create(
        @Body() httpDto: HttpCreateOrganizationDto,
    ): Promise<OrganizationResponseDto> {
        const org = await this.createOrganizationUseCase.execute(httpDto);
        return new OrganizationResponseDto(org);
    }

    @Get()
    @ApiOperation({
        summary: 'Listar organizaciones con filtros y paginación',
        description:
            'Listado paginado. Filtros opcionales por sector, tamaño y tipo de organización.',
    })
    @ApiResponse({
        status: 200,
        description: 'Listado paginado de organizaciones',
        type: PaginatedOrganizationResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async findAll(
        @Query() query: ListOrganizationsQueryDto,
    ): Promise<PaginatedOrganizationResponseDto> {
        const dto = new ListOrganizationsDto(
            query.sector,
            query.tamano,
            query.tipo,
            query.term,
            query.page,
            query.limit,
        );
        const { data, total } =
            await this.getAllOrganizationsUseCase.execute(dto);
        const responseData = data.map(
            (org) => new OrganizationResponseDto(org),
        );
        return new PaginatedOrganizationResponseDto(
            responseData,
            total,
            dto.page,
            dto.limit,
        );
    }

    @Get('sunat')
    @ApiOperation({
        summary: 'Consultar organizaciones en SUNAT por RUC o razón social',
        description:
            'Reenvía la consulta al servicio de SUNAT. Si `query` es un RUC (11 dígitos) devuelve un único resultado; si es un nombre, puede devolver varias coincidencias.',
    })
    @ApiQuery({
        name: 'query',
        required: true,
        type: String,
        description: 'RUC (11 dígitos) o razón social a buscar en SUNAT',
        example: '20123456789',
    })
    @ApiResponse({
        status: 200,
        description: 'Resultado(s) de la consulta a SUNAT',
        type: SunatCompanyResponseDto,
        isArray: false,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 404,
        description: 'No se encontraron resultados en SUNAT',
    })
    async querySunat(
        @Query('query') query: string,
    ): Promise<SunatCompanyResponseDto | SunatCompanyResponseDto[]> {
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
    @ApiOperation({
        summary: 'Obtener el detalle de una organización por ID',
        description:
            'Incluye la lista de contactos asociados y el total de contactos.',
    })
    @ApiResponse({
        status: 200,
        description: 'Detalle de la organización',
        type: OrganizationDetailResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 404, description: 'Organización no encontrada' })
    async findOne(
        @Param('id') id: string,
    ): Promise<OrganizationDetailResponseDto> {
        const detail = await this.getOrganizationByIdUseCase.execute(id);
        if (!detail) {
            throw new NotFoundException('Organización no encontrada');
        }
        return new OrganizationDetailResponseDto(
            detail.organization,
            detail.contactos,
            detail.totalContactos,
        );
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar una organización existente' })
    @ApiResponse({
        status: 200,
        description: 'Organización actualizada exitosamente',
        type: OrganizationResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 404, description: 'Organización no encontrada' })
    @ApiResponse({
        status: 409,
        description:
            'El código de cliente o el RUC ya pertenecen a otra organización',
    })
    async update(
        @Param('id') id: string,
        @Body() httpDto: HttpUpdateOrganizationDto,
    ): Promise<OrganizationResponseDto> {
        const org = await this.updateOrganizationUseCase.execute(id, httpDto);
        return new OrganizationResponseDto(org);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Desactivar una organización (eliminación lógica)',
        description:
            'Desactiva la organización sin borrarla (preserva su código de cliente para el monitoreo anual) y marca todos sus contactos con estado de correo VENCIDO.',
    })
    @ApiResponse({ status: 200, description: 'Organización desactivada' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 404, description: 'Organización no encontrada' })
    async remove(@Param('id') id: string): Promise<{ ok: true }> {
        return await this.deleteOrganizationUseCase.execute(id);
    }
}
