import { ValidationDomainException } from '@/shared/domain/exceptions/validation-domain.exception';

export class InvalidRucException extends ValidationDomainException {
    constructor(ruc: string, message?: string) {
        super(message || `El RUC '${ruc}' no es válido o no existe en SUNAT.`);
    }
}
