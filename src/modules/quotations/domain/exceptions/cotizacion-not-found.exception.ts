import { NotFoundDomainException } from '@/shared/domain/exceptions/not-found-domain.exception';

export class CotizacionNotFoundException extends NotFoundDomainException {
    constructor(message: string) {
        super(message);
    }
}
