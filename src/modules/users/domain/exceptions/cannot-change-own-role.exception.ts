import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class CannotChangeOwnRoleException extends ConflictDomainException {
    constructor(message: string) {
        super(message);
    }
}
