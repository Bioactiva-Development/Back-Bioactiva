import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class ActivityNotMeetingException extends ValidationDomainException {
    constructor(
        message = 'Solo las actividades de tipo Reunión pueden crear un evento en el calendario',
    ) {
        super(message);
    }
}
