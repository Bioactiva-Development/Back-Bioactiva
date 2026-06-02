import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    SUNAT_SERVICE,
    type ISunatService,
    SunatCompanyInfo,
} from '@/modules/organizations/domain/ports/sunat.service';

export class QuerySunatUseCase {
    constructor(
        @Inject(SUNAT_SERVICE)
        private readonly sunatService: ISunatService,
    ) {}

    async execute(
        query: string,
    ): Promise<SunatCompanyInfo[] | SunatCompanyInfo | null> {
        if (/^\d{11}$/.test(query)) {
            return await this.sunatService.getByRuc(query);
        }
        return await this.sunatService.getByRazonSocial(query);
    }
}
