import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import {
    IContactRepository,
    ContactWithOrgName,
    ListContactsParams,
} from '@/modules/contacts/domain/ports/contact.repository';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { ContactMapper } from '@/modules/contacts/infrastructure/persistence/mappers/contact.mapper';

@Injectable()
export class PrismaContactRepository implements IContactRepository {
    constructor(private readonly prisma: PrismaService) {}

    async save(contact: Contact): Promise<Contact> {
        const rawData = ContactMapper.toPersistence(contact);

        if (contact.id === 0) {
            const created = await this.prisma.contacto.create({
                data: rawData,
            });
            return ContactMapper.toDomain(created);
        }

        const updated = await this.prisma.contacto.update({
            where: { id: contact.id },
            data: rawData,
        });
        return ContactMapper.toDomain(updated);
    }

    async findById(id: number): Promise<Contact | null> {
        const record = await this.prisma.contacto.findUnique({ where: { id } });
        return record ? ContactMapper.toDomain(record) : null;
    }

    async findByEmail(email: string): Promise<Contact | null> {
        const record = await this.prisma.contacto.findFirst({
            where: { correo: email },
        });
        return record ? ContactMapper.toDomain(record) : null;
    }

    async findBySecondaryEmail(email: string): Promise<Contact | null> {
        const record = await this.prisma.contacto.findFirst({
            where: { correo2: email },
        });
        return record ? ContactMapper.toDomain(record) : null;
    }

    async findByOrganizationId(idOrganizacion: string): Promise<Contact[]> {
        const records = await this.prisma.contacto.findMany({
            where: { idOrganizacion },
        });
        return records.map((record) => ContactMapper.toDomain(record));
    }

    async findAll(): Promise<Contact[]> {
        const records = await this.prisma.contacto.findMany();
        return records.map((record) => ContactMapper.toDomain(record));
    }

    async findAllWithOrganization(): Promise<ContactWithOrgName[]> {
        const records = await this.prisma.contacto.findMany({
            include: { organizacion: { select: { nombre: true } } },
        });
        return records.map((r) => ({
            contact: ContactMapper.toDomain(r),
            organizationName: r.organizacion.nombre,
        }));
    }

    async findByIdWithOrganization(
        id: number,
    ): Promise<ContactWithOrgName | null> {
        const record = await this.prisma.contacto.findUnique({
            where: { id },
            include: { organizacion: { select: { nombre: true } } },
        });
        if (!record) return null;
        return {
            contact: ContactMapper.toDomain(record),
            organizationName: record.organizacion.nombre,
        };
    }

    async findByOrganizationIdWithOrganization(
        idOrganizacion: string,
    ): Promise<ContactWithOrgName[]> {
        const records = await this.prisma.contacto.findMany({
            where: { idOrganizacion },
            include: { organizacion: { select: { nombre: true } } },
        });
        return records.map((r) => ({
            contact: ContactMapper.toDomain(r),
            organizationName: r.organizacion.nombre,
        }));
    }

    private buildWhere(
        params?: Omit<ListContactsParams, 'page' | 'limit'>,
    ): Prisma.ContactoWhereInput {
        const where: Prisma.ContactoWhereInput = {};

        if (params?.idOrganization) {
            where.idOrganizacion = params.idOrganization;
        }
        if (params?.search) {
            where.OR = [
                { nombres: { contains: params.search, mode: 'insensitive' } },
                { apellidos: { contains: params.search, mode: 'insensitive' } },
                { correo: { contains: params.search, mode: 'insensitive' } },
                { cargo: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        return where;
    }

    async list(params?: ListContactsParams): Promise<ContactWithOrgName[]> {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 10;
        const where = this.buildWhere(params);

        const records = await this.prisma.contacto.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { organizacion: { select: { nombre: true } } },
        });
        return records.map((r) => ({
            contact: ContactMapper.toDomain(r),
            organizationName: r.organizacion.nombre,
        }));
    }

    async count(
        params?: Omit<ListContactsParams, 'page' | 'limit'>,
    ): Promise<number> {
        const where = this.buildWhere(params);
        return await this.prisma.contacto.count({ where });
    }
}
