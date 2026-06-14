import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class ActivityCalendarEventAlreadyExistsException extends ConflictDomainException {
    constructor(
        message = 'La actividad ya tiene un evento de calendario asociado',
    ) {
        super(message);
    }
}
