import { DomainException } from './domain.exception';
import { DomainErrorKind } from './domain-error-kind';

export abstract class ConflictDomainException extends DomainException {
    readonly kind = DomainErrorKind.Conflict;
}
