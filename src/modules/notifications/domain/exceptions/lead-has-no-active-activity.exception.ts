import { NotFoundDomainException } from '@/shared/domain/exceptions/not-found-domain.exception';

export class LeadHasNoActiveActivityException extends NotFoundDomainException {
    constructor(
        message = 'El lead no tiene una actividad activa a la que asociar la notificación',
    ) {
        super(message);
    }
}
