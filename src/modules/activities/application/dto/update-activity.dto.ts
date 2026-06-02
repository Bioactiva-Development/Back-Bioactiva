export class UpdateActivityDto {
    constructor(
        public readonly nombreActividad?: string,
        public readonly fechaInicio?: Date,
        public readonly fechaFin?: Date,
        public readonly notas?: string | null,
        public readonly idResponsable?: number,
    ) {}
}
