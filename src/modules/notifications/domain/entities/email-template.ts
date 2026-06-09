/** Plantilla de correo (CU011): base reutilizable de asunto/cuerpo. */
export class EmailTemplate {
    constructor(
        public readonly id: number | null,
        public nombre: string,
        public asunto: string,
        public cuerpo: string,
        public activo: boolean,
        public readonly created_at: Date,
        public updated_at: Date,
    ) {}

    static create(input: {
        nombre: string;
        asunto: string;
        cuerpo: string;
        activo?: boolean;
    }): EmailTemplate {
        const now = new Date();
        return new EmailTemplate(
            null,
            input.nombre,
            input.asunto,
            input.cuerpo,
            input.activo ?? true,
            now,
            now,
        );
    }

    update(fields: {
        nombre?: string;
        asunto?: string;
        cuerpo?: string;
        activo?: boolean;
    }): void {
        if (fields.nombre !== undefined) this.nombre = fields.nombre;
        if (fields.asunto !== undefined) this.asunto = fields.asunto;
        if (fields.cuerpo !== undefined) this.cuerpo = fields.cuerpo;
        if (fields.activo !== undefined) this.activo = fields.activo;
        this.updated_at = new Date();
    }
}
