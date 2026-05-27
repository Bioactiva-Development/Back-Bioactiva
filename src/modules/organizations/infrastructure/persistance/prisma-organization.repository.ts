import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { IOrganizationRepository } from '@/modules/organizations/domain/ports/organization.repository';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { OrganizationMapper } from '@/modules/organizations/infrastructure/mapper/organization.mapper';

@Injectable()
export class PrismaOrganizationRepository implements IOrganizationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async save(organization: Organization): Promise<Organization> {
        const rawData = OrganizationMapper.toPersistence(organization);

        if (!organization.id) {
            const created = await this.prisma.organizacion.create({
                data: rawData,
            });
            return OrganizationMapper.toDomain(created);
        }

        const updated = await this.prisma.organizacion.update({
            where: { id: organization.id },
            data: rawData,
        });
        return OrganizationMapper.toDomain(updated);
    }

    async findById(id: string): Promise<Organization | null> {
        const record = await this.prisma.organizacion.findUnique({
            where: { id },
        });
        return record ? OrganizationMapper.toDomain(record) : null;
    }

    async findByRuc(ruc: string): Promise<Organization | null> {
        const record = await this.prisma.organizacion.findFirst({
            where: { ruc },
        });
        return record ? OrganizationMapper.toDomain(record) : null;
    }

    async findAll(): Promise<Organization[]> {
        const records = await this.prisma.organizacion.findMany();
        return records.map((record) => OrganizationMapper.toDomain(record));
    }
}
