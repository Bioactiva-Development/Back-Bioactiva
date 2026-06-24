import { Injectable } from '@nestjs/common';
import {
    EstadoCorreo as PrismaEstadoCorreo,
    Sector as PrismaSector,
    Tamano as PrismaTamano,
    TipoEmpresa as PrismaTipoEmpresa,
    Prisma,
} from '@prisma/client';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import {
    IOrganizationRepository,
    type ListOrganizationsParams,
} from '@/modules/organizations/domain/ports/organization.repository';
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
            // toPersistence omite deletedAt (el soft-delete se gestiona aparte),
            // pero al reutilizar un registro por RUC necesitamos poder
            // restaurarlo (deletedAt = null), así que se escribe explícitamente.
            data: { ...rawData, deletedAt: organization.deletedAt },
        });
        return OrganizationMapper.toDomain(updated);
    }

    async findById(id: string): Promise<Organization | null> {
        const record = await this.prisma.organizacion.findFirst({
            where: { id, deletedAt: null },
        });
        return record ? OrganizationMapper.toDomain(record) : null;
    }

    async findByRuc(ruc: string): Promise<Organization | null> {
        const record = await this.prisma.organizacion.findFirst({
            where: { ruc },
        });
        return record ? OrganizationMapper.toDomain(record) : null;
    }

    async findByCodigoCliente(
        codigoCliente: string,
    ): Promise<Organization | null> {
        const record = await this.prisma.organizacion.findUnique({
            where: { codigoCliente },
        });
        return record ? OrganizationMapper.toDomain(record) : null;
    }

    private buildWhere(
        params?: Omit<ListOrganizationsParams, 'page' | 'limit'>,
    ): Prisma.OrganizacionWhereInput {
        const where: Prisma.OrganizacionWhereInput = { deletedAt: null };
        if (params?.term) {
            where.OR = [
                { nombre: { contains: params.term, mode: 'insensitive' } },
                {
                    nombreComercial: {
                        contains: params.term,
                        mode: 'insensitive',
                    },
                },
            ];
        }
        if (params?.sector) {
            where.sector = params.sector as PrismaSector;
        }
        if (params?.tamano) {
            where.tamano = params.tamano as PrismaTamano;
        }
        if (params?.tipo) {
            where.tipo = params.tipo as PrismaTipoEmpresa;
        }
        return where;
    }

    async findAll(params?: ListOrganizationsParams): Promise<Organization[]> {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 10;
        const records = await this.prisma.organizacion.findMany({
            where: this.buildWhere(params),
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return records.map((record) => OrganizationMapper.toDomain(record));
    }

    async countAll(
        params?: Omit<ListOrganizationsParams, 'page' | 'limit'>,
    ): Promise<number> {
        return this.prisma.organizacion.count({
            where: this.buildWhere(params),
        });
    }

    async softDelete(id: string): Promise<void> {
        // Desactivar la organización y vencer sus contactos debe ser atómico:
        // si una de las dos operaciones falla, ninguna se aplica. Se usa una
        // sola transacción (sin N+1) para marcar todos los contactos de la
        // organización con estado de correo VENCIDO.
        await this.prisma.$transaction([
            this.prisma.organizacion.update({
                where: { id },
                data: { deletedAt: new Date() },
            }),
            this.prisma.contacto.updateMany({
                where: { idOrganizacion: id },
                data: { estado_correo: PrismaEstadoCorreo.VENCIDO },
            }),
        ]);
    }
}
