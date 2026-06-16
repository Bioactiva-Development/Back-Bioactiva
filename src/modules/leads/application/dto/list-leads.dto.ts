import { ActivityAlertFilter } from '@/modules/leads/domain/enums/activity-alert-filter';

export class ListLeadsDto {
    constructor(
        public readonly estado?: string,
        public readonly idOrg?: string,
        public readonly idEncargado?: number,
        public readonly search?: string,
        public readonly page: number = 1,
        public readonly limit: number = 10,
        public readonly alertaActividad?: ActivityAlertFilter,
        public readonly fechaDesde?: Date,
        public readonly fechaHasta?: Date,
        public readonly term?: string,
        public readonly sector?: string,
    ) {}
}
