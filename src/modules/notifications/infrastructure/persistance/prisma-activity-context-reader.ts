import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import {
    type ActivityContext,
    type ActivityContextReaderPort,
} from '@/modules/notifications/domain/ports/activity-context-reader.port';

@Injectable()
export class PrismaActivityContextReader implements ActivityContextReaderPort {
    constructor(private readonly prisma: PrismaService) {}

    async getActiveActivityByLead(
        idLead: number,
    ): Promise<ActivityContext | null> {
        // Una sola actividad activa por lead (regla de negocio). "Activa" = aún
        // pendiente y no eliminada; REALIZADA/CANCELADA no se consideran activas.
        const actividad = await this.prisma.actividad.findFirst({
            where: { idLead, estado: 'PENDIENTE', deletedAt: null },
            include: this.contextInclude,
        });
        return actividad ? this.toContext(actividad) : null;
    }

    // El responsable de la actividad es, por regla de negocio, el encargado del
    // lead: se resuelve desde `lead.encargado` (fuente única de verdad), no desde
    // `actividad.idResponsable`.
    private readonly contextInclude = {
        lead: {
            include: {
                encargado: { select: { id: true, correo: true } },
                contacto: { select: { correo: true, correo2: true } },
            },
        },
    } as const;

    private toContext(actividad: {
        id: number;
        idLead: number;
        fechaFin: Date;
        estado: string;
        lead: {
            encargado: { id: number; correo: string };
            contacto: { correo: string | null; correo2: string | null } | null;
        };
    }): ActivityContext {
        const contacto = actividad.lead.contacto;
        const contactEmails = [contacto?.correo, contacto?.correo2].filter(
            (email): email is string => Boolean(email),
        );

        return {
            idActividad: actividad.id,
            idLead: actividad.idLead,
            idResponsable: actividad.lead.encargado.id,
            responsableEmail: actividad.lead.encargado.correo,
            fechaFin: actividad.fechaFin,
            estado: actividad.estado,
            contactEmails,
        };
    }

    async getUserEmail(idUsuario: number): Promise<string | null> {
        const user = await this.prisma.usuario.findUnique({
            where: { id: idUsuario },
            select: { correo: true },
        });
        return user?.correo ?? null;
    }
}
