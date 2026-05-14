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
        public id_organizacion: string,
        public id_author: number,
        public created_at: Date,
        public updated_at: Date,
        public estado_correo: EstadoCorreo = EstadoCorreo.VIGENTE,
    ) {}

    changeEmail(correo: string) {
        if (!correo.trim()) {
            throw new Error('El correo no puede estar vacío');
        }
        this.correo = correo;
        this.updated_at = new Date();
    }

    markExpired() {
        this.estado_correo = EstadoCorreo.VENCIDO;
        this.updated_at = new Date();
    }
}
