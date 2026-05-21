import { Vocative } from '@/modules/contacts/domain/enums/vocative';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';

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
        public idOrganizacion: string, // Cambiado de id_organizacion a camelCase para hacer match con el SQL
        public idAuthor: number, // Cambiado de id_author a camelCase
        public createdAt: Date, // Cambiado de created_at a camelCase
        public updatedAt: Date, // Cambiado de updated_at a camelCase
        public estado_correo: EstadoCorreo = EstadoCorreo.VIGENTE, // Mantiene snake_case como tu SQL
    ) {}

    changeEmail(correo: string) {
        if (!correo.trim()) {
            throw new Error('El correo no puede estar vacío');
        }
        this.correo = correo;
        this.updatedAt = new Date();
    }

    markExpired() {
        this.estado_correo = EstadoCorreo.VENCIDO;
        this.updatedAt = new Date();
    }
}
