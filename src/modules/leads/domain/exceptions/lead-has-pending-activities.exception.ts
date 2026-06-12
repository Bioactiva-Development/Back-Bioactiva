import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class LeadHasPendingActivitiesException extends ConflictDomainException {
    constructor(message: string) {
        super(message);
    }
}
