import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class ResponsibleNotConnectedException extends ValidationDomainException {
    constructor(
        message = 'El encargado de la actividad no tiene Microsoft conectado',
    ) {
        super(message);
    }
}
