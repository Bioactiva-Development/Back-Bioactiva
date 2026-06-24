import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    COTIZACION_REPOSITORY,
    type CotizacionRepositoryPort,
} from '@/modules/quotations/domain/ports/cotizacion-repository.port';
import { CotizacionNotFoundException } from '@/modules/quotations/domain/exceptions/cotizacion-not-found.exception';

export class GetCotizacionByIdUseCase {
    constructor(
        @Inject(COTIZACION_REPOSITORY)
        private readonly cotizacionRepository: CotizacionRepositoryPort,
    ) {}

    async execute(id: number) {
        const result =
            await this.cotizacionRepository.findByIdWithRelations(id);
        if (!result) {
            throw new CotizacionNotFoundException(
                'La cotización no fue encontrada',
            );
        }
        return result;
    }
}
