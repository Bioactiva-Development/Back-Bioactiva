import { DomainErrorKind } from './domain-error-kind';

export abstract class DomainException extends Error {
    abstract readonly kind: DomainErrorKind;

    protected constructor(message: string) {
        super(message);
        this.name = new.target.name;
    }
}
