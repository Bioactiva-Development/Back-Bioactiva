import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class EmailAlreadyExistsException extends ConflictDomainException {
    constructor(email: string) {
        super(
            `El correo electrónico '${email}' ya se encuentra registrado en el sistema.`,
        );
    }
}
