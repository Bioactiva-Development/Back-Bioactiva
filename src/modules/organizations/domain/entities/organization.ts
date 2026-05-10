import { EnterpriseType } from '@/modules/organizations/domain/enums/organization_type';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { Size } from '@/modules/organizations/domain/enums/size';

export class Organizacion {
    constructor(
        public readonly id: string,
        public nombre: string,
        public nombre_comercial: string,
        public sub_area: string | null,
        public ruc: string | null,
        public tipo: EnterpriseType,
        public linkedIn: string | null,
        public ubicacion: string | null,
        public sector: Sector,
        public tamanio: Size,
        public actividad_economica: string | null,
        public alianzas_estrategicas: string | null,
        public id_contacto_activo: number | null,
        public readonly created_at: Date,
        public updated_at: Date,
        public id_author: string,
    ) {}

    selectContact(idContacto: number) {
        if (this.id_contacto_activo === idContacto) {
            throw new Error('El contacto ya está seleccionado');
        }
        this.id_contacto_activo = idContacto;
    }
}
