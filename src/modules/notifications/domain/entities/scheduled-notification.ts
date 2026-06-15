import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';
import { NotificationCannotBeCancelledException } from '@/modules/notifications/domain/exceptions/notification-cannot-be-cancelled.exception';
import { FollowUpInstance } from '@/modules/notifications/domain/entities/follow-up-instance';

export interface InternalEmail {
    asunto: string;
    cuerpo: string;
    fechaEnvio: Date;
    idTemplate: number | null;
}

export interface FollowUpInstanceInput {
    internal: InternalEmail;
    external: {
        asunto: string;
        cuerpo: string;
        fechaEnvio: Date;
        idTemplate: number | null;
    };
}

/**
 * Notificación programada (CU007). Un RECORDATORIO solo envía el correo interno
 * al responsable (campos planos asunto/cuerpo internos). Un SEGUIMIENTO agrupa
 * de 1 a 3 instancias escalonadas ({@link FollowUpInstance}), cada una con su
 * correo interno y externo; el destinatario del cliente (`correo_cliente`) es el
 * mismo para todas las instancias. La entidad gestiona sus transiciones de estado.
 */
export class ScheduledNotification {
    constructor(
        public readonly id: number | null,
        public tipo: NotificationType,
        public estado: NotificationStatus,
        public id_actividad: number,
        public id_lead: number,
        public id_responsable: number,
        public asunto_interno: string | null,
        public cuerpo_interno: string | null,
        public fecha_envio_interno: Date | null,
        public id_template_interno: number | null,
        public job_id_interno: string | null,
        public enviado_interno: boolean,
        public correo_cliente: string | null,
        public instancias: FollowUpInstance[],
        public readonly created_at: Date,
        public updated_at: Date,
    ) {}

    static createReminder(input: {
        idActividad: number;
        idLead: number;
        idResponsable: number;
        internal: InternalEmail;
    }): ScheduledNotification {
        const now = new Date();
        return new ScheduledNotification(
            null,
            NotificationType.RECORDATORIO,
            NotificationStatus.PROGRAMADA,
            input.idActividad,
            input.idLead,
            input.idResponsable,
            input.internal.asunto,
            input.internal.cuerpo,
            input.internal.fechaEnvio,
            input.internal.idTemplate,
            null,
            false,
            null,
            [],
            now,
            now,
        );
    }

    static createFollowUp(input: {
        idActividad: number;
        idLead: number;
        idResponsable: number;
        correoCliente: string;
        instancias: FollowUpInstanceInput[];
    }): ScheduledNotification {
        const now = new Date();
        const instancias = input.instancias.map((instancia, index) =>
            FollowUpInstance.create({
                orden: index + 1,
                internal: instancia.internal,
                external: instancia.external,
            }),
        );
        return new ScheduledNotification(
            null,
            NotificationType.SEGUIMIENTO,
            NotificationStatus.PROGRAMADA,
            input.idActividad,
            input.idLead,
            input.idResponsable,
            null,
            null,
            null,
            null,
            null,
            false,
            input.correoCliente,
            instancias,
            now,
            now,
        );
    }

    isReminder(): boolean {
        return this.tipo === NotificationType.RECORDATORIO;
    }

    isFollowUp(): boolean {
        return this.tipo === NotificationType.SEGUIMIENTO;
    }

    assignInternalJob(jobId: string): void {
        this.job_id_interno = jobId;
        this.updated_at = new Date();
    }

    /** El correo interno de un recordatorio fue enviado: la notificación se cierra. */
    markInternalSent(): void {
        this.enviado_interno = true;
        if (this.isReminder()) {
            this.estado = NotificationStatus.VENCIDA;
        }
        this.updated_at = new Date();
    }

    /**
     * Si todas las instancias de un seguimiento ya se enviaron (interno y
     * externo), el seguimiento queda vencido.
     */
    closeIfAllInstancesSent(): void {
        if (
            this.isFollowUp() &&
            this.estado === NotificationStatus.PROGRAMADA &&
            this.instancias.length > 0 &&
            this.instancias.every((instancia) => instancia.isFullySent())
        ) {
            this.estado = NotificationStatus.VENCIDA;
            this.updated_at = new Date();
        }
    }

    /** Cancelación manual desde la pestaña Notificaciones (solo si está programada). */
    cancel(): void {
        if (this.estado !== NotificationStatus.PROGRAMADA) {
            throw new NotificationCannotBeCancelledException();
        }
        this.estado = NotificationStatus.CANCELADA;
        this.updated_at = new Date();
    }

    /**
     * El responsable marcó la actividad como completada: se cancelan los envíos
     * pendientes y el seguimiento se cierra.
     */
    completeFollowUp(): void {
        if (this.estado !== NotificationStatus.PROGRAMADA) {
            return;
        }
        this.estado = NotificationStatus.VENCIDA;
        this.updated_at = new Date();
    }

    /**
     * jobIds de los envíos de instancias que aún no se han enviado y que, por
     * tanto, deben cancelarse en BullMQ.
     */
    pendingInstanceJobIds(): string[] {
        const jobIds: string[] = [];
        for (const instancia of this.instancias) {
            if (instancia.hasPendingInternal() && instancia.job_id_interno) {
                jobIds.push(instancia.job_id_interno);
            }
            if (instancia.hasPendingExternal() && instancia.job_id_externo) {
                jobIds.push(instancia.job_id_externo);
            }
        }
        return jobIds;
    }
}
