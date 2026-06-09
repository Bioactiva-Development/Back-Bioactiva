import { Logger } from '@nestjs/common';
import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    STALE_LEAD_READER,
    type StaleLeadReaderPort,
} from '@/modules/notifications/domain/ports/stale-lead-reader.port';
import {
    IN_APP_NOTIFICATION_REPOSITORY,
    type InAppNotificationRepositoryPort,
} from '@/modules/notifications/domain/ports/in-app-notification-repository.port';
import { InAppNotification } from '@/modules/notifications/domain/entities/in-app-notification';

export const STALE_LEAD_THRESHOLD_DAYS = 30;

/**
 * CU007 (alerta automática): genera una notificación in-app para el encargado de
 * cada lead abierto con más de 30 días sin cambio de estado. Evita duplicados
 * reutilizando la última alerta del lead dentro de la misma ventana.
 */
export class GenerateStaleLeadAlertsUseCase {
    private readonly logger = new Logger(GenerateStaleLeadAlertsUseCase.name);

    constructor(
        @Inject(STALE_LEAD_READER)
        private readonly staleLeadReader: StaleLeadReaderPort,
        @Inject(IN_APP_NOTIFICATION_REPOSITORY)
        private readonly inAppNotificationRepository: InAppNotificationRepositoryPort,
    ) {}

    async execute(): Promise<{ created: number }> {
        const leads = await this.staleLeadReader.getStaleLeads(
            STALE_LEAD_THRESHOLD_DAYS,
        );

        let created = 0;
        for (const lead of leads) {
            const alreadyAlerted =
                await this.inAppNotificationRepository.hasRecentLeadAlert(
                    lead.idLead,
                    STALE_LEAD_THRESHOLD_DAYS,
                );
            if (alreadyAlerted) {
                continue;
            }

            await this.inAppNotificationRepository.create(
                InAppNotification.createLeadAlert({
                    idUsuario: lead.idEncargado,
                    idLead: lead.idLead,
                    titulo: 'Lead sin avance',
                    mensaje: `El lead #${lead.idLead} lleva más de ${STALE_LEAD_THRESHOLD_DAYS} días sin cambio de estado y requiere revisión.`,
                }),
            );
            created += 1;
        }

        this.logger.log(
            `Alerta de leads estancados: ${created} notificación(es) generada(s) de ${leads.length} lead(s) detectado(s).`,
        );
        return { created };
    }
}
