import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { Size } from '@/modules/organizations/domain/enums/size';

export class Organizacion {
    constructor(
        public readonly id: string,
        public codigo_cliente: string,
        public nombre: string,
        public nombre_comercial: string,
        public sub_area: string | null,
        public ruc: string | null,
        public tipo: EnterpriseType,
        public linkedIn: string | null,
        public ubicacion: string | null,
        public sector: Sector | null,
        public tamanio: Size,
        public actividad_economica: string | null,
        public alianzas_estrategicas: string | null,
        public id_contacto_activo: number | null,
        public readonly created_at: Date,
        public updated_at: Date,
        public id_author: number,
    ) {}

    rename(nombre: string) {
        if (!nombre.trim()) {
            throw new Error('El nombre no puede estar vacío');
        }
        this.nombre = nombre;
        this.updated_at = new Date();
    }

    updateCommercialName(nombreComercial: string) {
        this.nombre_comercial = nombreComercial;
        this.updated_at = new Date();
    }

    selectContact(idContacto: number) {
        if (this.id_contacto_activo === idContacto) {
            throw new Error('El contacto ya está seleccionado');
        }
        this.id_contacto_activo = idContacto;
        this.updated_at = new Date();
    }

    clearSelectedContact() {
        this.id_contacto_activo = null;
        this.updated_at = new Date();
    }
}
