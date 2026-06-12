import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class InvitationAlreadyAcceptedException extends ConflictDomainException {
    constructor(message: string) {
        super(message);
    }
}
