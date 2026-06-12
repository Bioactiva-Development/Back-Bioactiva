import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

export class ActiveResetTokenException extends ConflictDomainException {
    constructor(
        message = 'Ya existe una solicitud de recuperación activa. Espere 5 minutos antes de intentarlo nuevamente.',
    ) {
        super(message);
    }
}
