import { NotFoundDomainException } from '@/shared/domain/exceptions/not-found-domain.exception';

export class EmptyExportException extends NotFoundDomainException {
    constructor(target: string) {
        super(
            `No hay datos de "${target}" que exportar con los filtros aplicados.`,
        );
    }
}
