import { EnterpriseType } from '@modules/organizations/domain/enums/organization-type';
import { Sector } from '@modules/organizations/domain/enums/sector';
import { Size } from '@modules/organizations/domain/enums/size';

export class Organization {
    constructor(
        public readonly id: string,
        public codigoCliente: string,
        public nombre: string,
        public nombreComercial: string,
        public subArea: string | null,
        public ruc: string | null,
        public tipo: EnterpriseType,
        public linkedin: string | null,
        public ubicacion: string | null,
        public sector: Sector,
        public tamano: Size,
        public actividadEconomica: string | null,
        public alianzasEstrategicas: string | null,
        public idContactoActivo: number | null,
        public idAuthor: number,
        public readonly createdAt: Date,
        public updatedAt: Date,
        /**
         * Marca de desactivación (soft-delete). Se preserva el registro y su
         * `codigoCliente` para el monitoreo anual; al desactivar, los contactos
         * de la organización pasan a estado de correo VENCIDO.
         */
        public deletedAt: Date | null = null,
    ) {}

    isDeleted(): boolean {
        return this.deletedAt !== null;
    }

    rename(nombre: string) {
        if (!nombre?.trim()) {
            throw new Error(
                'El nombre de la organización (Razón Social) no puede estar vacío',
            );
        }
        this.nombre = nombre;
        this.updatedAt = new Date();
    }

    updateCommercialName(nombreComercial: string) {
        if (!nombreComercial?.trim()) {
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

    updateRuc(ruc: string) {
        if (!/^\d{11}$/.test(ruc)) {
            throw new Error('El RUC debe tener 11 dígitos');
        }
        this.ruc = ruc;
        this.updatedAt = new Date();
    }
}
