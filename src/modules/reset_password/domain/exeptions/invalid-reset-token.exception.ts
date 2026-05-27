import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class InvalidResetTokenException extends ValidationDomainException {
    constructor(
        message = 'Token de restablecimiento de contraseña inválido o ya utilizado',
    ) {
        super(message);
    }
}
