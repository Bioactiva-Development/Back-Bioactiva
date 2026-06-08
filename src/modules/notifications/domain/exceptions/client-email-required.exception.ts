import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class ClientEmailRequiredException extends ValidationDomainException {
    constructor(
        message = 'El seguimiento requiere un correo de cliente válido asociado al lead.',
    ) {
        super(message);
    }
}
