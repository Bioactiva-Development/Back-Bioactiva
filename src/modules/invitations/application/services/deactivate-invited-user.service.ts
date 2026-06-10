import { Injectable } from '@shared/infrastructure/dependency-inyection/inyectable';
import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import { UserState } from '@/modules/users/domain/enums/estado';

/**
 * Desactiva al usuario provisional asociado a una invitación que dejó de estar
 * vigente (cancelada o expirada). Solo afecta a cuentas que nunca completaron
 * su registro; los usuarios ya registrados quedan intactos. Es idempotente: si
 * el usuario no existe, ya completó su registro o ya está suspendido, no hace
 * nada.
 */
@Injectable()
export class DeactivateInvitedUserService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(correo: string): Promise<void> {
        const user = await this.userRepository.findByCorreo(correo);
        if (
            !user ||
            !user.isProvisional() ||
            user.estado === UserState.SUSPENDIDO
        ) {
            return;
        }

        user.deactivate();
        await this.userRepository.save(user);
    }

    /**
     * Versión por lotes de {@link execute}: resuelve todos los correos con una
     * sola consulta (evita el N+1 de lecturas) y desactiva solo las cuentas
     * provisionales aún no suspendidas. Mantiene la idempotencia: correos sin
     * usuario, ya registrados o ya suspendidos se ignoran.
     */
    async executeMany(correos: string[]): Promise<void> {
        if (correos.length === 0) {
            return;
        }

        const users = await this.userRepository.findByCorreos(correos);
        const provisionales = users.filter(
            (user) =>
                user.isProvisional() && user.estado !== UserState.SUSPENDIDO,
        );

        for (const user of provisionales) {
            user.deactivate();
            await this.userRepository.save(user);
        }
    }
}
