import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class InvitationRevokedException extends ConflictDomainException {
    constructor(message: string) {
        super(message);
    }
}
