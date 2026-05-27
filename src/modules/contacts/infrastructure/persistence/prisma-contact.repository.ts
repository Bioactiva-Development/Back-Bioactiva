import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { IContactRepository } from '@/modules/contacts/domain/ports/contact.repository';
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
}
