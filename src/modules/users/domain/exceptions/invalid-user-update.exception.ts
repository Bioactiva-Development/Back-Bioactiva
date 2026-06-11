import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

/**
 * Actualización de usuario inválida a nivel de reglas de negocio: por ejemplo,
 * no enviar ningún campo a modificar o reutilizar la contraseña actual.
 */
export class InvalidUserUpdateException extends ValidationDomainException {
    constructor(message: string) {
        super(message);
    }
}
