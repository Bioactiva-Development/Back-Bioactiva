import { DomainException } from './domain.exception';
import { DomainErrorKind } from './domain-error-kind';

export abstract class NotFoundDomainException extends DomainException {
    readonly kind = DomainErrorKind.NotFound;
}
