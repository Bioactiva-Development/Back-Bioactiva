import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class EmailTemplateInUseException extends ConflictDomainException {
    constructor(
        message = 'No se puede eliminar la plantilla porque está asociada a una notificación. Desactívela en su lugar.',
    ) {
        super(message);
    }
}
