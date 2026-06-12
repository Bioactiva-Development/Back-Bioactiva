import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import {
    type ActivityContext,
    type ActivityContextReaderPort,
} from '@/modules/notifications/domain/ports/activity-context-reader.port';

@Injectable()
export class PrismaActivityContextReader implements ActivityContextReaderPort {
    constructor(private readonly prisma: PrismaService) {}

    async getByActivityId(
        idActividad: number,
    ): Promise<ActivityContext | null> {
        const actividad = await this.prisma.actividad.findFirst({
            where: { id: idActividad, deletedAt: null },
            include: {
                responsable: { select: { correo: true } },
                lead: {
                    include: {
                        contacto: { select: { correo: true, correo2: true } },
                    },
                },
            },
        });
        if (!actividad) {
            return null;
        }

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
