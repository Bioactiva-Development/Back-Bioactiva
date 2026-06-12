import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class OrganizationAlreadyExistsException extends ConflictDomainException {
    constructor(ruc: string) {
        super(`La organización con ruc ${ruc} ya se encuentra registrada.`);
    }
}
