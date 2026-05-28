import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class InvitationExpiredException extends ConflictDomainException {
    constructor(message: string) {
        super(message);
    }
}
