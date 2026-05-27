import { Injectable } from '@nestjs/common';
// import { PrismaService } from '/infrastructure/prisma.service'; // Ajusta la ruta a tu PrismaService global
import { PrismaService } from '../../../common/prisma/prisma.service';

import { IContactRepository } from '../../domain/ports/contact.repository';

import { Contact } from '../../domain/entities/contact';
import { ContactMapper } from './mappers/contact.mapper';

@Injectable()
export class PrismaContactRepository implements IContactRepository {
    constructor(private readonly prisma: PrismaService) {}

    async save(contact: Contact): Promise<Contact> {
        const rawData = ContactMapper.toPersistence(contact);

        // Si el ID es 0 o no existe en BD, creamos un registro. Si existe, actualizamos.
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

    async findByOrganizationId(idOrganizacion: string): Promise<Contact[]> {
        const records = await this.prisma.contacto.findMany({
            where: { idOrganizacion },
        });
        return records.map(ContactMapper.toDomain);
    }

    async findAll(): Promise<Contact[]> {
        const records = await this.prisma.contacto.findMany();
        return records.map(ContactMapper.toDomain);
    }
}
