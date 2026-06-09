import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class InvalidScheduleDateException extends ValidationDomainException {
    constructor(message: string) {
        super(message);
    }
}
