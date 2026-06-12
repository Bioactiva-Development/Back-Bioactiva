import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class ResetTokenExpiredException extends ValidationDomainException {
    constructor(
        message = 'El token de restablecimiento de contraseña ha expirado',
    ) {
        super(message);
    }
}
