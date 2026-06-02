import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class InvalidActivityTransitionException extends ValidationDomainException {
    constructor(message: string) {
        super(message);
    }
}
