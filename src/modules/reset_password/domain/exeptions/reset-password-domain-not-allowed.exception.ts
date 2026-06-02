import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class ResetPasswordDomainNotAllowedException extends ValidationDomainException {
    constructor(
        message = 'El dominio del correo electrónico no está permitido',
    ) {
        super(message);
    }
}
