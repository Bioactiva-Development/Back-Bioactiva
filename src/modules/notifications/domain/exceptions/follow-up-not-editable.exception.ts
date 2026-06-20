import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class FollowUpNotEditableException extends ConflictDomainException {
    constructor(
        message = 'El seguimiento no puede editarse: debe estar programado y sin correos enviados.',
    ) {
        super(message);
    }
}
