import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';

export class CreateActivityDto {
    constructor(
        public readonly idLead: number,
        public readonly nombreActividad: string,
        public readonly fechaInicio: Date,
        public readonly fechaFin: Date,
        public readonly tipo: TipoActividad,
        public readonly notas: string | null,
        public readonly idResponsable: number,
    ) {}
}
