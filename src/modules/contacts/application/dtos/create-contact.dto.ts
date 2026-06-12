import { Vocative } from '@/modules/contacts/domain/enums/vocative';

export class CreateContactDto {
    constructor(
        public readonly nombres: string,
        public readonly apellidos: string | null,
        public readonly vocativo: Vocative | null,
        public readonly cargo: string | null,
        public readonly correo: string,
        public readonly telefono: string | null,
        public readonly correo2: string | null,
        public readonly comentarios: string | null,
        public readonly idOrganizacion: string,
        public readonly idAuthor: number,
    ) {}
}
