import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { OfferedLeadHandlerPort } from '@/modules/leads/domain/ports/offered-lead-handler.port';
import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import {
    COTIZACION_REPOSITORY,
    type CotizacionRepositoryPort,
} from '@/modules/quotations/domain/ports/cotizacion-repository.port';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import { ORGANIZATION_REPOSITORY } from '@/modules/organizations/domain/ports/organization.repository';
import type { IOrganizationRepository } from '@/modules/organizations/domain/ports/organization.repository';
import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';

/**
 * Mantiene la cotización de un Lead sincronizada con el estado de éste cuando el
 * cambio se origina en el lead (PATCH /leads/{id}/status):
 *
 *  - Al pasar a OFERTADO y aún no existe cotización, genera un borrador
 *    (PENDIENTE) prellenado con los datos del lead y su organización, vinculado
 *    al lead, para que la administradora lo complete después.
 *  - En cualquier otro cambio de estado refleja el mapeo 1:1 sobre la cotización
 *    existente: CIERRE_CON_VENTA -> ACEPTADA, CIERRE_SIN_VENTA -> RECHAZADA y la
 *    reapertura a OFERTADO -> PENDIENTE.
 *
 * Es un efecto best-effort: cualquier fallo se registra pero no interrumpe el
 * cambio de estado del lead. La auto-generación del borrador se puede desactivar
 * con la variable de entorno `AUTO_COTIZACION_ON_OFERTADO=false` (habilitado por
 * defecto); la sincronización de una cotización ya existente siempre se aplica.
 */
@Injectable()
export class CreateCotizacionForOfferedLeadHandler
    implements OfferedLeadHandlerPort
{
    private readonly logger = new Logger(
        CreateCotizacionForOfferedLeadHandler.name,
    );

    constructor(
        @Inject(COTIZACION_REPOSITORY)
        private readonly cotizacionRepository: CotizacionRepositoryPort,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        @Inject(ORGANIZATION_REPOSITORY)
        private readonly organizationRepository: IOrganizationRepository,
        private readonly configService: ConfigService,
    ) {}

    async handle(lead: Lead): Promise<void> {
        if (lead.id === null) {
            return;
        }

        try {
            const existing = await this.cotizacionRepository.findByLead(
                lead.id,
            );

            if (!existing) {
                // Sin cotización previa: solo se auto-genera un borrador al
                // entrar a OFERTADO (y si la generación automática está activa).
                if (lead.estado === LeadState.OFERTADO && this.isEnabled()) {
                    await this.createDraft(lead);
                }
                return;
            }

            // Ya existe: refleja el estado del lead en la cotización.
            if (existing.syncWithLeadState(lead.estado)) {
                await this.cotizacionRepository.save(existing);
            }
        } catch (error) {
            // La sincronización es un efecto secundario: si falla, el cambio de
            // estado del lead no debe romperse. Se registra para diagnóstico.
            this.logger.error(
                `No se pudo sincronizar la cotización del lead ${lead.id}`,
                error instanceof Error ? error.stack : String(error),
            );
        }
    }

    private async createDraft(lead: Lead): Promise<void> {
        const [remitente, organization] = await Promise.all([
            this.userRepository.findById(lead.id_encargado),
            this.organizationRepository.findById(lead.id_org),
        ]);

        const nombreRemitente = remitente
            ? `${remitente.nombres} ${remitente.apellidos}`
            : 'Por asignar';
        const dirigido =
            organization?.nombreComercial ??
            organization?.nombre ??
            'Por definir';

        const cotizacion = new Cotizacion(
            null,
            new Date(),
            dirigido,
            organization?.nombre ?? null,
            null,
            nombreRemitente,
            lead.servicio_interes,
            '0.00',
            TipoMoneda.PEN,
            EstadoCot.PENDIENTE,
            null,
            null,
            lead.id!,
            lead.id_encargado,
            lead.id_author,
            new Date(),
            new Date(),
            null,
        );

        await this.cotizacionRepository.saveWithRelations(cotizacion);
    }

    private isEnabled(): boolean {
        const raw = this.configService.get<string>('AUTO_COTIZACION_ON_OFERTADO');
        // Habilitado por defecto; solo se desactiva con un "false" explícito.
        return raw === undefined ? true : raw.toLowerCase() === 'true';
    }
}
