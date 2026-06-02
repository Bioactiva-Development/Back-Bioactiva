export class ListCotizacionesDto {
    constructor(
        public readonly idLead?: number,
        public readonly estado?: string,
        public readonly idRemitente?: number,
        public readonly fechaDesde?: Date,
        public readonly fechaHasta?: Date,
        public readonly page: number = 1,
        public readonly limit: number = 10,
    ) {}
}
