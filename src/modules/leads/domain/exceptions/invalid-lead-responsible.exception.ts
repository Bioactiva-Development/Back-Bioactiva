import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class InvalidLeadResponsibleException extends ValidationDomainException {
    constructor(message: string) {
        super(message);
    }
}
