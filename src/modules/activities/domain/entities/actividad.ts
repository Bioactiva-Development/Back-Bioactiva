import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';

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
    ) {}

    markCompleted() {
        this.estado = EstadoActividad.REALIZADA;
        this.updated_at = new Date();
    }

    cancel() {
        if (this.estado === EstadoActividad.CANCELADA) {
            throw new Error('La actividad ya está cancelada');
        }

        this.estado = EstadoActividad.CANCELADA;
        this.updated_at = new Date();
    }

    reschedule(fechaInicio: Date, fechaFin: Date) {
        if (fechaFin < fechaInicio) {
            throw new Error(
                'La fecha fin no puede ser anterior a la fecha inicio',
            );
        }

        this.fecha_inicio = fechaInicio;
        this.fecha_fin = fechaFin;
        this.updated_at = new Date();
    }
}
