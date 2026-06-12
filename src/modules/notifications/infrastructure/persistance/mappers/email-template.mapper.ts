import { TemplateEmail as PrismaTemplateEmail, Prisma } from '@prisma/client';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';

export class EmailTemplateMapper {
    static toDomain(record: PrismaTemplateEmail): EmailTemplate {
        return new EmailTemplate(
            record.id,
            record.nombre,
            record.asunto,
            record.cuerpo,
            record.activo,
            record.createdAt,
            record.updatedAt,
        );
    }

    static toCreateData(
        template: EmailTemplate,
    ): Prisma.TemplateEmailUncheckedCreateInput {
        return {
            nombre: template.nombre,
            asunto: template.asunto,
            cuerpo: template.cuerpo,
            activo: template.activo,
        };
    }

    static toUpdateData(
        template: EmailTemplate,
    ): Prisma.TemplateEmailUncheckedUpdateInput {
        return {
            nombre: template.nombre,
            asunto: template.asunto,
            cuerpo: template.cuerpo,
            activo: template.activo,
        };
    }
}
