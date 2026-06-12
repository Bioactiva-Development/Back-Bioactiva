import { Injectable } from '@nestjs/common';
import { LeadState } from '@prisma/client';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import {
    type StaleLead,
    type StaleLeadReaderPort,
} from '@/modules/notifications/domain/ports/stale-lead-reader.port';

@Injectable()
export class PrismaStaleLeadReader implements StaleLeadReaderPort {
    constructor(private readonly prisma: PrismaService) {}

    async getStaleLeads(thresholdDays: number): Promise<StaleLead[]> {
        const cutoff = new Date(
            Date.now() - thresholdDays * 24 * 60 * 60 * 1000,
        );

        const leads = await this.prisma.lead.findMany({
            where: {
                deletedAt: null,
                estado: {
                    notIn: [
                        LeadState.CIERRE_CON_VENTA,
                        LeadState.CIERRE_SIN_VENTA,
                    ],
                },
                ultimoCambioEstado: { lt: cutoff },
            },
            select: {
                id: true,
                idEncargado: true,
                ultimoCambioEstado: true,
            },
        });

        return leads.map((lead) => ({
            idLead: lead.id,
            idEncargado: lead.idEncargado,
            ultimoCambioEstado: lead.ultimoCambioEstado,
        }));
    }
}
