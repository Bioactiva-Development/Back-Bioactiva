import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class CotizacionConflictException extends ConflictDomainException {
    constructor(message: string) {
        super(message);
    }
}
