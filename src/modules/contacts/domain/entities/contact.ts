import { Vocative } from '@/modules/contacts/domain/enums/vocative';

export class Contact {
    constructor(
        public readonly id: number,
        public nombres: string,
        public apellidos: string | null,
        public vocativo: Vocative | null,
        public cargo: string | null,
        public correo: string,
        public telefono: string | null,
        public correo2: string | null,
        public comentarios: string | null,
        public id_organizacion: string,
        public id_author: string,
        public created_at: Date,
        public updated_at: Date,
    ) {}
}
