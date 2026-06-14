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

    private readonly contextInclude = {
        responsable: { select: { correo: true } },
        lead: {
            include: {
                contacto: { select: { correo: true, correo2: true } },
            },
        },
    } as const;

    private toContext(actividad: {
        id: number;
        idLead: number;
        idResponsable: number;
        fechaFin: Date;
        estado: string;
        responsable: { correo: string };
        lead: { contacto: { correo: string | null; correo2: string | null } | null };
    }): ActivityContext {
        const contacto = actividad.lead.contacto;
        const contactEmails = [contacto?.correo, contacto?.correo2].filter(
            (email): email is string => Boolean(email),
        );

        return {
            idActividad: actividad.id,
            idLead: actividad.idLead,
            idResponsable: actividad.idResponsable,
            responsableEmail: actividad.responsable.correo,
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
