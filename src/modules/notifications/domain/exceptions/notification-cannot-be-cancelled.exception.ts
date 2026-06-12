import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class NotificationCannotBeCancelledException extends ConflictDomainException {
    constructor(
        message = 'La notificación no puede cancelarse porque ya fue ejecutada.',
    ) {
        super(message);
    }
}
