import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class MicrosoftOAuthFailedException extends ValidationDomainException {
    constructor(message: string) {
        super(message);
    }
}
