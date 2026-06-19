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
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';
import { formatDateTimeInZone } from '@/shared/infrastructure/datetime/format-in-zone';

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
        private readonly appTime: AppTimeConfig,
    ) {}

    async execute(): Promise<{ created: number }> {
        const leads = await this.staleLeadReader.getStaleLeads(
            STALE_LEAD_THRESHOLD_DAYS,
        );

        if (leads.length === 0) {
            this.logger.log(
                'Alerta de leads estancados: 0 lead(s) detectado(s).',
            );
            return { created: 0 };
        }

        // Una sola consulta para saber qué leads ya tienen alerta reciente,
        // en vez de una por lead (N+1).
        const alreadyAlerted = new Set(
            await this.inAppNotificationRepository.findLeadIdsWithRecentAlert(
                leads.map((lead) => lead.idLead),
                STALE_LEAD_THRESHOLD_DAYS,
            ),
        );

        const nuevasAlertas = leads
            .filter((lead) => !alreadyAlerted.has(lead.idLead))
            .map((lead) =>
                InAppNotification.createLeadAlert({
                    idUsuario: lead.idEncargado,
                    idLead: lead.idLead,
                    titulo: 'Lead sin avance',
                    mensaje: `El lead #${lead.idLead} no registra cambios de estado desde el ${formatDateTimeInZone(
                        lead.ultimoCambioEstado,
                        this.appTime.timeZone,
                    )} (más de ${STALE_LEAD_THRESHOLD_DAYS} días) y requiere revisión.`,
                }),
            );

        // Un solo INSERT masivo en vez de uno por notificación.
        const created =
            await this.inAppNotificationRepository.createMany(nuevasAlertas);

        this.logger.log(
            `Alerta de leads estancados: ${created} notificación(es) generada(s) de ${leads.length} lead(s) detectado(s).`,
        );
        return { created };
    }
}
