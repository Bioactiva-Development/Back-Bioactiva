import { UnauthorizedDomainException } from '@/shared/domain/exceptions/unauthorized-domain.exception';

export class NotAuthorizedException extends UnauthorizedDomainException {
    constructor(message: string) {
        super(message);
    }
}
