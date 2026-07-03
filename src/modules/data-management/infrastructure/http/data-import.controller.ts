import {
    BadRequestException,
    Controller,
    Get,
    NotFoundException,
    Param,
    Post,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { User } from '@/modules/users/domain/entities/user';
import { ValidateImportUseCase } from '@/modules/data-management/application/use-cases/validate-import.use-case';
import { GenerateTemplateUseCase } from '@/modules/data-management/application/use-cases/generate-template.use-case';
import { ImportPublisher } from '@/modules/data-management/infrastructure/queue/import.publisher';

const XLSX_MIME =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Tamaño máximo permitido para un archivo de importación (10 MB). */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Forma mínima del archivo subido por multer (evita depender de @types/multer). */
interface UploadedExcel {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}

@ApiTags('data-management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('data/import')
export class DataImportController {
    constructor(
        private readonly validateImportUseCase: ValidateImportUseCase,
        private readonly generateTemplateUseCase: GenerateTemplateUseCase,
        private readonly importPublisher: ImportPublisher,
    ) {}

    @Get('template')
    @ApiOperation({
        summary: 'Descargar la plantilla de importación (.xlsx)',
        description:
            'Libro con las hojas Organizaciones, Contactos, Leads y Cotizaciones más una hoja "Valores válidos".',
    })
    @ApiResponse({
        status: 200,
        description: 'Archivo .xlsx de la plantilla',
        content: {
            [XLSX_MIME]: { schema: { type: 'string', format: 'binary' } },
        },
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async template(@Res() res: Response): Promise<void> {
        const buffer = await this.generateTemplateUseCase.execute();
        res.set({
            'Content-Type': XLSX_MIME,
            'Content-Disposition':
                'attachment; filename="plantilla_importacion_crm.xlsx"',
            'Content-Length': buffer.length.toString(),
        });
        res.end(buffer);
    }

    @Post('validate')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Validar archivo de importación (dry-run, no escribe en BD)',
        description:
            'Parsea el archivo .xlsx (máx. 10 MB) y devuelve errores/advertencias por fila junto con los conteos de filas parseadas por hoja, sin persistir nada.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Archivo .xlsx a validar',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description:
            'Resultado de la validación: { valid, errors[], warnings[], parsedCounts }',
    })
    @ApiResponse({
        status: 400,
        description:
            'No se adjuntó archivo, el tipo/tamaño no es válido, o el archivo no es un Excel legible',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async validate(@UploadedFile() file: UploadedExcel) {
        this.assertFile(file);
        try {
            return await this.validateImportUseCase.execute(file.buffer);
        } catch (err) {
            throw new BadRequestException(
                err instanceof Error
                    ? err.message
                    : 'El archivo no es un Excel válido.',
            );
        }
    }

    @Post('commit')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary:
            'Importar archivo (procesamiento asíncrono). Devuelve un jobId.',
        description:
            'Encola el archivo para procesarlo en segundo plano. Consultar el progreso/resultado con GET /data/import/jobs/:id.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Archivo .xlsx a importar',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Importación encolada exitosamente',
        schema: { example: { jobId: '1234' } },
    })
    @ApiResponse({
        status: 400,
        description: 'No se adjuntó archivo o el tipo/tamaño no es válido',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async commit(
        @UploadedFile() file: UploadedExcel,
        @CurrentUser() user: User,
    ): Promise<{ jobId: string }> {
        this.assertFile(file);
        if (!user?.id) {
            throw new BadRequestException('Usuario no identificado.');
        }
        const jobId = await this.importPublisher.enqueue({
            fileBase64: file.buffer.toString('base64'),
            filename: this.sanitizeFilename(file.originalname),
            userId: user.id,
        });
        return { jobId };
    }

    @Get('jobs/:id')
    @ApiOperation({
        summary: 'Consultar el estado/resultado de una importación',
        description:
            'Solo devuelve el job si pertenece al usuario autenticado (el que la encoló).',
    })
    @ApiResponse({
        status: 200,
        description: 'Estado del job de importación',
        schema: {
            example: {
                id: '1234',
                state: 'completed',
                progress: 100,
                result: {
                    inserted: {
                        organizaciones: 3,
                        contactos: 5,
                        leads: 2,
                        cotizaciones: 1,
                    },
                },
                failedReason: null,
            },
        },
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 404,
        description: 'Job no encontrado o no pertenece al usuario autenticado',
    })
    async jobStatus(@Param('id') id: string, @CurrentUser() user: User) {
        const job = await this.importPublisher.getQueue().getJob(id);
        if (!job || (job.data as { userId?: number }).userId !== user.id) {
            throw new NotFoundException(
                `Job de importación ${id} no encontrado`,
            );
        }
        const state = await job.getState();
        return {
            id: job.id,
            state,
            progress: job.progress,
            result: job.returnvalue ?? null,
            failedReason: job.failedReason ?? null,
        };
    }

    private assertFile(file: UploadedExcel | undefined): void {
        if (!file?.buffer || file.size === 0) {
            throw new BadRequestException(
                'Debe adjuntar un archivo .xlsx en el campo "file".',
            );
        }
        if (file.mimetype !== XLSX_MIME) {
            throw new BadRequestException(
                `Tipo de archivo no permitido ("${file.mimetype}"). Solo se aceptan archivos .xlsx.`,
            );
        }
        if (file.size > MAX_FILE_BYTES) {
            throw new BadRequestException(
                `El archivo supera el tamaño máximo permitido (${MAX_FILE_BYTES / 1024 / 1024} MB).`,
            );
        }
    }

    /** Elimina caracteres peligrosos del nombre de archivo antes de loguearlo o encolarlo. */
    private sanitizeFilename(name: string): string {
        return name.replaceAll(/[^a-zA-Z0-9._\- ]/g, '_').slice(0, 255);
    }
}
