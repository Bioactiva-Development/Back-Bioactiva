import { NotFoundDomainException } from '@/shared/domain/exceptions/not-found-domain.exception';

export class ContactNotFoundException extends NotFoundDomainException {
    constructor(id: number) {
        super(`El contacto con ID '${id}' no fue encontrado.`);
    }
}
