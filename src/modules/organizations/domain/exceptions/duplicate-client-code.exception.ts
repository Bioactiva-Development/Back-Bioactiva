import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class DuplicateClientCodeException extends ConflictDomainException {
    constructor(codigoCliente: string) {
        super(
            `El código de cliente "${codigoCliente}" ya está registrado en otra organización. Ingrese un código distinto.`,
        );
    }
}
