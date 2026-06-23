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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { User } from '@/modules/users/domain/entities/user';
import { ValidateImportUseCase } from '@/modules/data-management/application/use-cases/validate-import.use-case';
import { GenerateTemplateUseCase } from '@/modules/data-management/application/use-cases/generate-template.use-case';
import { ImportPublisher } from '@/modules/data-management/infrastructure/queue/import.publisher';

const XLSX_MIME =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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
    })
    async validate(@UploadedFile() file: UploadedExcel) {
        this.assertFile(file);
        return this.validateImportUseCase.execute(file.buffer);
    }

    @Post('commit')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Importar archivo (procesamiento asíncrono). Devuelve un jobId.',
    })
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
            filename: file.originalname,
            userId: user.id,
        });
        return { jobId };
    }

    @Get('jobs/:id')
    @ApiOperation({ summary: 'Consultar el estado/resultado de una importación' })
    async jobStatus(@Param('id') id: string) {
        const job = await this.importPublisher.getQueue().getJob(id);
        if (!job) {
            throw new NotFoundException(`Job de importación ${id} no encontrado`);
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
    }
}
