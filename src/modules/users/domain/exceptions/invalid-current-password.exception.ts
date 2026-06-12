import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class InvalidCurrentPasswordException extends ValidationDomainException {
    constructor(message: string) {
        super(message);
    }
}
