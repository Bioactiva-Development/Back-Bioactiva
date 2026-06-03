import {
    Actividad as PrismaActividad,
    EstadoActividad as PrismaEstadoActividad,
    TipoActividad as PrismaTipoActividad,
    Prisma,
} from '@prisma/client';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';

export class ActivityMapper {
    static mapState(state: PrismaEstadoActividad): EstadoActividad {
        switch (state) {
            case 'PENDIENTE':
                return EstadoActividad.PENDIENTE;
            case 'REALIZADA':
                return EstadoActividad.REALIZADA;
            case 'CANCELADA':
                return EstadoActividad.CANCELADA;
        }
    }

    static mapStateToPrisma(state: EstadoActividad): PrismaEstadoActividad {
        switch (state) {
            case EstadoActividad.PENDIENTE:
                return 'PENDIENTE';
            case EstadoActividad.REALIZADA:
                return 'REALIZADA';
            case EstadoActividad.CANCELADA:
                return 'CANCELADA';
        }
    }

    static mapType(type: PrismaTipoActividad): TipoActividad {
        switch (type) {
            case 'REUNION':
                return TipoActividad.REUNION;
            case 'LLAMADA':
                return TipoActividad.LLAMADA;
            case 'EMAIL':
                return TipoActividad.EMAIL;
            case 'OTRO':
                return TipoActividad.OTRO;
        }
    }

    static mapTypeToPrisma(type: TipoActividad): PrismaTipoActividad {
        switch (type) {
            case TipoActividad.REUNION:
                return 'REUNION';
            case TipoActividad.LLAMADA:
                return 'LLAMADA';
            case TipoActividad.EMAIL:
                return 'EMAIL';
            case TipoActividad.OTRO:
                return 'OTRO';
        }
    }

    static toDomain(record: PrismaActividad): Actividad {
        return new Actividad(
            record.id,
            record.nombreActividad,
            record.fechaInicio,
            record.fechaFin,
            this.mapType(record.tipo),
            this.mapState(record.estado),
            record.notas,
            record.outlookEventId,
            record.outlookImported,
            record.teamsMeetingUrl,
            record.seguimientoAutomatico,
            record.idLead,
            record.idResponsable,
            record.createdAt,
            record.updatedAt,
            record.deletedAt,
        );
    }

    static toPersistence(activity: Actividad): Prisma.ActividadCreateInput {
        return {
            lead: { connect: { id: activity.id_lead } },
            responsable: { connect: { id: activity.id_responsable } },
            nombreActividad: activity.nombre_actividad,
            fechaInicio: activity.fecha_inicio,
            fechaFin: activity.fecha_fin,
            tipo: this.mapTypeToPrisma(activity.tipo),
            estado: this.mapStateToPrisma(activity.estado),
            notas: activity.notas,
            outlookEventId: activity.outlook_event_id,
            outlookImported: activity.outlook_imported,
            teamsMeetingUrl: activity.teams_meeting_url,
            seguimientoAutomatico: activity.seguimiento_automatico,
            deletedAt: activity.deleted_at,
        };
    }
}
