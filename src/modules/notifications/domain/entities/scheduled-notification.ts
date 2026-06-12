import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';
import { NotificationCannotBeCancelledException } from '@/modules/notifications/domain/exceptions/notification-cannot-be-cancelled.exception';

export interface InternalEmail {
    asunto: string;
    cuerpo: string;
    fechaEnvio: Date;
    idTemplate: number | null;
}

export interface ExternalEmail {
    correoCliente: string;
    asunto: string;
    cuerpo: string;
    fechaEnvio: Date;
    idTemplate: number | null;
}

/**
 * Notificación programada (CU007). Un RECORDATORIO solo envía el correo interno
 * al responsable; un SEGUIMIENTO añade el correo externo al cliente. La entidad
 * conserva una copia editable del asunto/cuerpo por envío (la plantilla original
 * no se muta) y gestiona sus transiciones de estado.
 */
export class ScheduledNotification {
    constructor(
        public readonly id: number | null,
        public tipo: NotificationType,
        public estado: NotificationStatus,
        public id_actividad: number,
        public id_lead: number,
        public id_responsable: number,
        public asunto_interno: string,
        public cuerpo_interno: string,
        public fecha_envio_interno: Date,
        public id_template_interno: number | null,
        public job_id_interno: string | null,
        public enviado_interno: boolean,
        public correo_cliente: string | null,
        public asunto_externo: string | null,
        public cuerpo_externo: string | null,
        public fecha_envio_externo: Date | null,
        public id_template_externo: number | null,
        public job_id_externo: string | null,
        public enviado_externo: boolean,
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
            null,
            null,
            null,
            null,
            null,
            false,
            now,
            now,
        );
    }

    static createFollowUp(input: {
        idActividad: number;
        idLead: number;
        idResponsable: number;
        internal: InternalEmail;
        external: ExternalEmail;
    }): ScheduledNotification {
        const now = new Date();
        return new ScheduledNotification(
            null,
            NotificationType.SEGUIMIENTO,
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
            input.external.correoCliente,
            input.external.asunto,
            input.external.cuerpo,
            input.external.fechaEnvio,
            input.external.idTemplate,
            null,
            false,
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

    assignExternalJob(jobId: string): void {
        this.job_id_externo = jobId;
        this.updated_at = new Date();
    }

    /** El correo interno fue enviado. En un recordatorio cierra la notificación. */
    markInternalSent(): void {
        this.enviado_interno = true;
        if (this.isReminder()) {
            this.estado = NotificationStatus.VENCIDA;
        }
        this.updated_at = new Date();
    }

    /** El correo externo fue enviado: el seguimiento queda vencido. */
    markExternalSent(): void {
        this.enviado_externo = true;
        this.estado = NotificationStatus.VENCIDA;
        this.updated_at = new Date();
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
     * El responsable marcó la actividad como completada antes de la fecha del
     * correo externo: se cancela el envío al cliente y el seguimiento se cierra.
     */
    completeFollowUp(): void {
        if (this.estado !== NotificationStatus.PROGRAMADA) {
            return;
        }
        this.estado = NotificationStatus.VENCIDA;
        this.updated_at = new Date();
    }

    /** ¿Queda un envío externo pendiente que deba cancelarse en BullMQ? */
    hasPendingExternal(): boolean {
        return this.isFollowUp() && !this.enviado_externo;
    }
}
