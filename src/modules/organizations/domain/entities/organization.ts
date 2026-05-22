import { EnterpriseType } from '../enums/organization-type';
import { Sector } from '../enums/sector';
import { Size } from '../enums/size';

export class Organization {
    constructor(
        public readonly id: string,
        public codigoCliente: string,
        public nombre: string, // Representa la Razón Social en el dominio
        public nombreComercial: string,
        public subArea: string | null,
        public ruc: string | null,
        public tipo: EnterpriseType,
        public linkedin: string | null,
        public ubicacion: string | null,
        public sector: Sector | null,
        public tamano: Size,
        public actividadEconomica: string | null,
        public alianzasEstrategicas: string | null,
        public idContactoActivo: number | null,
        public idAuthor: number,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) {}

    rename(nombre: string) {
        if (!nombre || !nombre.trim()) {
            throw new Error('El nombre de la organización (Razón Social) no puede estar vacío');
        }
        this.nombre = nombre;
        this.updatedAt = new Date();
    }

    updateCommercialName(nombreComercial: string) {
        if (!nombreComercial || !nombreComercial.trim()) {
            throw new Error('El nombre comercial no puede estar vacío');
        }
        this.nombreComercial = nombreComercial;
        this.updatedAt = new Date();
    }

    selectContact(idContacto: number) {
        if (this.idContactoActivo === idContacto) {
            throw new Error('El contacto ya está seleccionado como activo');
        }
        this.idContactoActivo = idContacto;
        this.updatedAt = new Date();
    }

    clearSelectedContact() {
        this.idContactoActivo = null;
        this.updatedAt = new Date();
    }
}
