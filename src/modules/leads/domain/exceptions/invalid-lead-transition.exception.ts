import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class InvalidLeadTransitionException extends ConflictDomainException {
    constructor(message: string) {
        super(message);
    }
}
