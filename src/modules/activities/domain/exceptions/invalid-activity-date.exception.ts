import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class InvalidActivityDateException extends ValidationDomainException {
    constructor(message: string) {
        super(message);
    }
}
