import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class DuplicateNotificationException extends ConflictDomainException {
    constructor(
        message = 'Si desea registrar una nueva notificación, debe eliminar la que está asociada actualmente.',
    ) {
        super(message);
    }
}
