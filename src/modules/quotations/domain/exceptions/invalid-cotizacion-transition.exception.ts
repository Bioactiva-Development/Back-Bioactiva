import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class InvalidCotizacionTransitionException extends ValidationDomainException {
    constructor(message: string) {
        super(message);
    }
}
