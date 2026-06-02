import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class LeadContactInvalidException extends ValidationDomainException {
    constructor(message: string) {
        super(message);
    }
}
