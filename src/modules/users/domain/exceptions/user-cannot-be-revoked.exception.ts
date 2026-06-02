import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class UserCannotBeRevokedException extends ConflictDomainException {
    constructor(message: string) {
        super(message);
    }
}
