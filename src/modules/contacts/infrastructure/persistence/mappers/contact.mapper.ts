import { Contacto as PrismaContactModel } from '@prisma/client';
import { Contact } from '../../../domain/entities/contact';
import { Vocative } from '../../../domain/enums/vocative';
import { EstadoCorreo } from '../../../domain/enums/estado-correo';

export class ContactMapper {
    // Convierte lo que devuelve Prisma en una entidad de nuestro dominio
    static toDomain(raw: PrismaContactModel): Contact {
        return new Contact(
            raw.id,
            raw.nombres,
            raw.apellidos,
            raw.vocativo as Vocative | null,
            raw.cargo,
            raw.correo,
            raw.telefono,
            raw.correo2,
            raw.comentarios,
            raw.idOrganizacion,
            raw.idAuthor,
            raw.createdAt,
            raw.updatedAt,
            raw.estado_correo as EstadoCorreo,
        );
    }

    // Convierte nuestra entidad de dominio en un objeto plano compatible con Prisma
    static toPersistence(
        domain: Contact,
    ): Omit<PrismaContactModel, 'id' | 'createdAt' | 'updatedAt'> {
        return {
            nombres: domain.nombres,
            apellidos: domain.apellidos,
            vocativo: domain.vocativo,
            cargo: domain.cargo,
            correo: domain.correo,
            telefono: domain.telefono,
            correo2: domain.correo2,
            comentarios: domain.comentarios,
            idOrganizacion: domain.idOrganizacion,
            idAuthor: domain.idAuthor,
            estado_correo: domain.estado_correo,
        };
    }
}
