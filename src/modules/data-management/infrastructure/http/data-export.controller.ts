import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import {
    ExportWorkbookUseCase,
    type ExportOptions,
    type ExportTarget,
} from '@/modules/data-management/application/use-cases/export-workbook.use-case';
import {
    ExportOrganizacionesQueryDto,
    ExportContactosQueryDto,
    ExportLeadsQueryDto,
    ExportCotizacionesQueryDto,
    ExportAllQueryDto,
} from '@/modules/data-management/infrastructure/http/dtos/export-query.dto.http';

const XLSX_MIME =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@ApiTags('data-management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('data/export')
export class DataExportController {
    constructor(
        private readonly exportWorkbookUseCase: ExportWorkbookUseCase,
    ) {}

    @Get('organizaciones')
    @ApiOperation({
        summary: 'Exportar organizaciones a Excel',
        description:
            'Filtros: nombre, ruc, sector, tipo, tamano, includeDeleted.',
    })
    @ApiResponse({
        status: 200,
        description: 'Archivo .xlsx con las organizaciones exportadas',
        content: {
            [XLSX_MIME]: { schema: { type: 'string', format: 'binary' } },
        },
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async exportOrganizaciones(
        @Query() query: ExportOrganizacionesQueryDto,
        @Res() res: Response,
    ): Promise<void> {
        await this.send(
            res,
            'organizaciones',
            {
                includeDeleted: query.includeDeleted ?? false,
                org: {
                    nombre: query.nombre,
                    ruc: query.ruc,
                    sector: query.sector,
                    tipo: query.tipo,
                    tamano: query.tamano,
                },
            },
            'organizaciones',
        );
    }

    @Get('contactos')
    @ApiOperation({
        summary: 'Exportar contactos a Excel',
        description: 'Filtros: nombre, correo, organizacion.',
    })
    @ApiResponse({
        status: 200,
        description: 'Archivo .xlsx con los contactos exportados',
        content: {
            [XLSX_MIME]: { schema: { type: 'string', format: 'binary' } },
        },
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async exportContactos(
        @Query() query: ExportContactosQueryDto,
        @Res() res: Response,
    ): Promise<void> {
        await this.send(
            res,
            'contactos',
            {
                includeDeleted: false,
                contact: {
                    nombre: query.nombre,
                    correo: query.correo,
                    organizacion: query.organizacion,
                },
            },
            'contactos',
        );
    }

    @Get('leads')
    @ApiOperation({
        summary: 'Exportar leads a Excel',
        description: 'Filtros: estado, servicio, organizacion.',
    })
    @ApiResponse({
        status: 200,
        description: 'Archivo .xlsx con los leads exportados',
        content: {
            [XLSX_MIME]: { schema: { type: 'string', format: 'binary' } },
        },
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async exportLeads(
        @Query() query: ExportLeadsQueryDto,
        @Res() res: Response,
    ): Promise<void> {
        await this.send(
            res,
            'leads',
            {
                includeDeleted: false,
                lead: {
                    estado: query.estado,
                    servicio: query.servicio,
                    organizacion: query.organizacion,
                },
            },
            'leads',
        );
    }

    @Get('cotizaciones')
    @ApiOperation({
        summary: 'Exportar cotizaciones a Excel',
        description: 'Filtros: cliente, servicio, estado.',
    })
    @ApiResponse({
        status: 200,
        description: 'Archivo .xlsx con las cotizaciones exportadas',
        content: {
            [XLSX_MIME]: { schema: { type: 'string', format: 'binary' } },
        },
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async exportCotizaciones(
        @Query() query: ExportCotizacionesQueryDto,
        @Res() res: Response,
    ): Promise<void> {
        await this.send(
            res,
            'cotizaciones',
            {
                includeDeleted: false,
                cotizacion: {
                    cliente: query.cliente,
                    servicio: query.servicio,
                    estado: query.estado,
                },
            },
            'cotizaciones',
        );
    }

    @Get('all')
    @ApiOperation({
        summary: 'Exportar todo el CRM a un libro de 4 hojas',
        description:
            'Genera Organizaciones, Contactos, Leads y Cotizaciones en el formato del archivo de importación. Sin filtros por entidad (solo includeDeleted).',
    })
    @ApiResponse({
        status: 200,
        description: 'Archivo .xlsx con las 4 hojas del CRM exportadas',
        content: {
            [XLSX_MIME]: { schema: { type: 'string', format: 'binary' } },
        },
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async exportAll(
        @Query() query: ExportAllQueryDto,
        @Res() res: Response,
    ): Promise<void> {
        await this.send(
            res,
            'all',
            { includeDeleted: query.includeDeleted ?? false },
            'crm_bioactiva',
        );
    }

    private async send(
        res: Response,
        target: ExportTarget,
        options: ExportOptions,
        baseName: string,
    ): Promise<void> {
        const buffer = await this.exportWorkbookUseCase.execute(
            target,
            options,
        );

        const stamp = new Date().toISOString().slice(0, 10);
        const filename = `${baseName}_${stamp}.xlsx`;

        res.set({
            'Content-Type': XLSX_MIME,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length.toString(),
        });
        res.end(buffer);
    }
}
