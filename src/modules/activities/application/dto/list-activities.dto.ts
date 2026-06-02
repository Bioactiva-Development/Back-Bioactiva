export class ListActivitiesDto {
    constructor(
        public readonly idLead?: number,
        public readonly idResponsable?: number,
        public readonly estado?: string,
        public readonly tipo?: string,
        public readonly fechaInicio?: Date,
        public readonly fechaFin?: Date,
        public readonly page: number = 1,
        public readonly limit: number = 10,
    ) {}
}
