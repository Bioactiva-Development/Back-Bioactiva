import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    COTIZACION_REPOSITORY,
    type CotizacionRepositoryPort,
} from '@/modules/quotations/domain/ports/cotizacion-repository.port';
import { CotizacionNotFoundException } from '@/modules/quotations/domain/exceptions/cotizacion-not-found.exception';

export class DeleteCotizacionUseCase {
    constructor(
        @Inject(COTIZACION_REPOSITORY)
        private readonly cotizacionRepository: CotizacionRepositoryPort,
    ) {}

    async execute(id: number) {
        const cotizacion = await this.cotizacionRepository.findById(id);
        if (!cotizacion) {
            throw new CotizacionNotFoundException(
                'La cotización no fue encontrada',
            );
        }

        cotizacion.markAsDeleted();
        await this.cotizacionRepository.save(cotizacion);
        return { ok: true };
    }
}
