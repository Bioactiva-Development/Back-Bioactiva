import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import {
    type EmailTemplate,
    type EmailTemplateReaderPort,
} from '@/modules/notifications/domain/ports/email-template-reader.port';

@Injectable()
export class PrismaEmailTemplateReader implements EmailTemplateReaderPort {
    constructor(private readonly prisma: PrismaService) {}

    async listActive(): Promise<EmailTemplate[]> {
        const records = await this.prisma.templateEmail.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' },
        });
        return records.map((record) => ({
            id: record.id,
            nombre: record.nombre,
            asunto: record.asunto,
            cuerpo: record.cuerpo,
            activo: record.activo,
        }));
    }

    async findActiveById(id: number): Promise<EmailTemplate | null> {
        const record = await this.prisma.templateEmail.findFirst({
            where: { id, activo: true },
        });
        if (!record) {
            return null;
        }
        return {
            id: record.id,
            nombre: record.nombre,
            asunto: record.asunto,
            cuerpo: record.cuerpo,
            activo: record.activo,
        };
    }
}
