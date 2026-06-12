import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class TemplateRequiredException extends ValidationDomainException {
    constructor(message = 'Debe seleccionar una plantilla de correo') {
        super(message);
    }
}
