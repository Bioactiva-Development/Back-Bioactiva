import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    COTIZACION_REPOSITORY,
    type CotizacionRepositoryPort,
} from '@/modules/quotations/domain/ports/cotizacion-repository.port';
import { ListCotizacionesDto } from '@/modules/quotations/application/dto/list-cotizaciones.dto';

export class ListCotizacionesUseCase {
    constructor(
        @Inject(COTIZACION_REPOSITORY)
        private readonly cotizacionRepository: CotizacionRepositoryPort,
    ) {}

    async execute(dto: ListCotizacionesDto) {
        const { page, limit, ...filters } = dto;
        const [data, total] = await Promise.all([
            this.cotizacionRepository.list({ ...filters, page, limit }),
            this.cotizacionRepository.count(filters),
        ]);
        return { data, total };
    }
}
