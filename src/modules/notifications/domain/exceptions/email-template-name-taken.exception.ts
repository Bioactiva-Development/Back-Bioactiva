import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class EmailTemplateNameTakenException extends ConflictDomainException {
    constructor(nombre: string) {
        super(`Ya existe una plantilla con el nombre "${nombre}"`);
    }
}
