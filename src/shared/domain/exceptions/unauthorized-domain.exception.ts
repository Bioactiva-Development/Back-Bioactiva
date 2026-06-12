import { DomainException } from './domain.exception';
import { DomainErrorKind } from './domain-error-kind';

export abstract class UnauthorizedDomainException extends DomainException {
    readonly kind = DomainErrorKind.Unauthorized;
}
