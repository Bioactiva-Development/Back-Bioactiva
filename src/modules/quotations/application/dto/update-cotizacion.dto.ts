export class UpdateCotizacionDto {
    constructor(
        public readonly fechaCot?: Date,
        public readonly dirigido?: string,
        public readonly cliente?: string | null,
        public readonly producto?: string | null,
        public readonly nombreServicio?: string,
        public readonly monto?: string,
        public readonly tipo?: string,
        public readonly observacion?: string | null,
        public readonly linkPropuesta?: string | null,
    ) {}
}
