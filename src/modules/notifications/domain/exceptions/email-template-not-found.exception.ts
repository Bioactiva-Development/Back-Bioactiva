import { NotFoundDomainException } from '@/shared/domain/exceptions/not-found-domain.exception';

export class EmailTemplateNotFoundException extends NotFoundDomainException {
    constructor(message: string) {
        super(message);
    }
}
