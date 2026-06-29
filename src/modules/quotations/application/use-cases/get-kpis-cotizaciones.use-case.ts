import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    COTIZACION_REPOSITORY,
    type CotizacionKpis,
    type CotizacionRepositoryPort,
    type KpisCotizacionesParams,
} from '@/modules/quotations/domain/ports/cotizacion-repository.port';

export class GetKpisCotizacionesUseCase {
    constructor(
        @Inject(COTIZACION_REPOSITORY)
        private readonly cotizacionRepository: CotizacionRepositoryPort,
    ) {}

    execute(params?: KpisCotizacionesParams): Promise<CotizacionKpis> {
        return this.cotizacionRepository.getKpis(params);
    }
}
