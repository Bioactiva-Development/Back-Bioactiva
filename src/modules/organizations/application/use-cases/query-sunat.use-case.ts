import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    ISunatService,
    SunatCompanyInfo,
} from '@/modules/organizations/domain/ports/sunat.service';

export class QuerySunatUseCase {
    constructor(
        @Inject(ISunatService)
        private readonly sunatService: ISunatService,
    ) {}

    async execute(
        query: string,
    ): Promise<SunatCompanyInfo[] | SunatCompanyInfo | null> {
        if (/^\d{11}$/.test(query)) {
            // si cumple con los 11 numeros
            return await this.sunatService.getByRuc(query);
        }
        return await this.sunatService.getByRazonSocial(query);
    }
}
