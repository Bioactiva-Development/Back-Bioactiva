import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';
import { EmailTemplateRepositoryPort } from '@/modules/notifications/domain/ports/email-template-repository.port';
import { EmailTemplateMapper } from '@/modules/notifications/infrastructure/persistance/mappers/email-template.mapper';

@Injectable()
export class PrismaEmailTemplateRepository
    implements EmailTemplateRepositoryPort
{
    constructor(private readonly prisma: PrismaService) {}

    async create(template: EmailTemplate): Promise<EmailTemplate> {
        const created = await this.prisma.templateEmail.create({
            data: EmailTemplateMapper.toCreateData(template),
        });
        return EmailTemplateMapper.toDomain(created);
    }

    async save(template: EmailTemplate): Promise<EmailTemplate> {
        const updated = await this.prisma.templateEmail.update({
            where: { id: template.id! },
            data: EmailTemplateMapper.toUpdateData(template),
        });
        return EmailTemplateMapper.toDomain(updated);
    }

    async findById(id: number): Promise<EmailTemplate | null> {
        const record = await this.prisma.templateEmail.findUnique({
            where: { id },
        });
        return record ? EmailTemplateMapper.toDomain(record) : null;
    }

    async findByName(nombre: string): Promise<EmailTemplate | null> {
        const record = await this.prisma.templateEmail.findUnique({
            where: { nombre },
        });
        return record ? EmailTemplateMapper.toDomain(record) : null;
    }

    async list(includeInactive: boolean): Promise<EmailTemplate[]> {
        const records = await this.prisma.templateEmail.findMany({
            where: includeInactive ? undefined : { activo: true },
            orderBy: { nombre: 'asc' },
        });
        return records.map((record) => EmailTemplateMapper.toDomain(record));
    }

    async delete(id: number): Promise<void> {
        await this.prisma.templateEmail.delete({ where: { id } });
    }

    async isUsedByNotification(id: number): Promise<boolean> {
        const count = await this.prisma.notificacionProgramada.count({
            where: {
                OR: [
                    { idTemplateInterno: id },
                    { idTemplateExterno: id },
                ],
            },
        });
        return count > 0;
    }
}
