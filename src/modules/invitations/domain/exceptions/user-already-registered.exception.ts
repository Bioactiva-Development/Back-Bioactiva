import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class UserAlreadyRegisteredException extends ConflictDomainException {
    constructor(message: string) {
        super(message);
    }
}
