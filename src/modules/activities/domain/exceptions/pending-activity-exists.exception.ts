import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class PendingActivityExistsException extends ConflictDomainException {
    constructor(message: string) {
        super(message);
    }
}
