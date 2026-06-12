import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class InvalidInvitationTokenException extends ValidationDomainException {
    constructor(message: string) {
        super(message);
    }
}
