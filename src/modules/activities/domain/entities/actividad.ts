import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { InvalidActivityDateException } from '@/modules/activities/domain/exceptions/invalid-activity-date.exception';
import { InvalidActivityTransitionException } from '@/modules/activities/domain/exceptions/invalid-activity-transition.exception';

export class Actividad {
    constructor(
        public readonly id: number,
        public nombre_actividad: string,
        public fecha_inicio: Date,
        public fecha_fin: Date,
        public tipo: TipoActividad,
        public estado: EstadoActividad = EstadoActividad.PENDIENTE,
        public notas: string | null,
        public outlook_event_id: string | null,
        public outlook_imported: boolean,
        public teams_meeting_url: string | null,
        public seguimiento_automatico: boolean,
        public id_lead: number,
        public id_responsable: number,
        public readonly created_at: Date,
        public updated_at: Date,
        public deleted_at: Date | null,
    ) {}

    markCompleted() {
        if (this.estado !== EstadoActividad.PENDIENTE) {
            throw new InvalidActivityTransitionException(
                `No se puede completar una actividad en estado ${this.estado}`,
            );
        }

        this.estado = EstadoActividad.REALIZADA;
        this.updated_at = new Date();
    }

    cancel() {
        if (this.estado !== EstadoActividad.PENDIENTE) {
            throw new InvalidActivityTransitionException(
                `No se puede cancelar una actividad en estado ${this.estado}`,
            );
        }

        this.estado = EstadoActividad.CANCELADA;
        this.updated_at = new Date();
    }

    reschedule(fechaInicio: Date, fechaFin: Date) {
        if (fechaFin <= fechaInicio) {
            throw new InvalidActivityDateException(
                'La fecha de inicio debe ser menor que la fecha de fin',
            );
        }

        this.fecha_inicio = fechaInicio;
        this.fecha_fin = fechaFin;
        this.updated_at = new Date();
    }

    markAsDeleted() {
        this.deleted_at = new Date();
        this.updated_at = new Date();
    }
}
