import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

/**
 * Un usuario provisional (creado por una invitación pero que nunca completó su
 * registro) no puede habilitarse: quedó SUSPENDIDO al revocarse o expirar su
 * invitación y debe ser invitado nuevamente para acceder al sistema.
 */
export class ProvisionalUserCannotBeEnabledException extends ConflictDomainException {
    constructor(message: string) {
        super(message);
    }
}
