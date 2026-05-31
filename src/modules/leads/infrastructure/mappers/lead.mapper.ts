import {
    Lead as PrismaLead,
    LeadState as PrismaLeadState,
    Prisma,
} from '@prisma/client';
import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';

export class LeadMapper {
    static mapState(state: PrismaLeadState): LeadState {
        switch (state) {
            case 'EN_PROSPECTO':
                return LeadState.EN_PROSPECTO;
            case 'OFERTADO':
                return LeadState.OFERTADO;
            case 'CIERRE_CON_VENTA':
                return LeadState.CIERRE_CON_VENTA;
            case 'CIERRE_SIN_VENTA':
                return LeadState.CIERRE_SIN_VENTA;
        }
    }
    static mapStateToPrisma(state: LeadState): PrismaLeadState {
        switch (state) {
            case LeadState.EN_PROSPECTO:
                return 'EN_PROSPECTO';
            case LeadState.OFERTADO:
                return 'OFERTADO';
            case LeadState.CIERRE_CON_VENTA:
                return 'CIERRE_CON_VENTA';
            case LeadState.CIERRE_SIN_VENTA:
                return 'CIERRE_SIN_VENTA';
        }
    }
    static toDomain(record: PrismaLead): Lead {
        return new Lead(
            record.id,
            record.idOrg,
            record.idContacto,
            this.mapState(record.estado),
            record.servicioInteres,
            record.comentarios,
            record.desafioOportunidad,
            record.notasContacto,
            record.idEncargado,
            record.canalCaptacion,
            record.idAuthor,
            record.createdAt,
            record.updatedAt,
            record.deletedAt,
            record.ultimoCambioEstado,
        );
    }
    static toPersistence(lead: Lead): Prisma.LeadCreateInput {
        return {
            author: { connect: { id: lead.id_author } },
            encargado: { connect: { id: lead.id_encargado } },
            contacto: lead.id_contacto
                ? { connect: { id: lead.id_contacto } }
                : undefined,
            organizacion: { connect: { id: lead.id_org } },
            estado: this.mapStateToPrisma(lead.estado),
            servicioInteres: lead.servicio_interes,
            comentarios: lead.comentarios,
            desafioOportunidad: lead.desafio_oportunidad,
            notasContacto: lead.notas_contacto,
            canalCaptacion: lead.canal_captacion,
            updatedAt: lead.updated_at,
            ultimoCambioEstado: lead.ultimo_cambio?.toDateString(),
        };
    }
}
