import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { OfferedLeadHandlerPort } from '@/modules/leads/domain/ports/offered-lead-handler.port';
import { Lead } from '@/modules/leads/domain/entities/lead';
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
 * Al pasar un Lead a OFERTADO, genera una cotización borrador (PENDIENTE)
 * prellenada con los datos del lead y su organización, vinculada al lead, para
 * que la administradora la complete después. Es un efecto best-effort: cualquier
 * fallo se registra pero no interrumpe el cambio de estado del lead.
 *
 * Se puede desactivar con la variable de entorno
 * `AUTO_COTIZACION_ON_OFERTADO=false` (habilitado por defecto).
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
        if (!this.isEnabled() || lead.id === null) {
            return;
        }

        try {
            // Evita duplicados: si el lead ya tiene cotizaciones no se genera otra
            // (p. ej. si el lead vuelve a entrar a OFERTADO).
            const existing = await this.cotizacionRepository.count({
                idLead: lead.id,
            });
            if (existing > 0) {
                return;
            }

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
                lead.id,
                lead.id_encargado,
                lead.id_author,
                new Date(),
                new Date(),
                null,
            );

            await this.cotizacionRepository.saveWithRelations(cotizacion);
        } catch (error) {
            // El borrador es un efecto secundario: si falla, el cambio de estado
            // del lead no debe romperse. Se registra para diagnóstico.
            this.logger.error(
                `No se pudo generar la cotización borrador para el lead ${lead.id}`,
                error instanceof Error ? error.stack : String(error),
            );
        }
    }

    private isEnabled(): boolean {
        const raw = this.configService.get<string>('AUTO_COTIZACION_ON_OFERTADO');
        // Habilitado por defecto; solo se desactiva con un "false" explícito.
        return raw === undefined ? true : raw.toLowerCase() === 'true';
    }
}
