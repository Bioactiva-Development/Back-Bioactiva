import { DomainException } from './domain.exception';
import { DomainErrorKind } from './domain-error-kind';

export abstract class ForbiddenDomainException extends DomainException {
    readonly kind = DomainErrorKind.Forbidden;
}
