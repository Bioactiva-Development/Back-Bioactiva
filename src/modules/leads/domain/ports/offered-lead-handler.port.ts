import { Lead } from '@/modules/leads/domain/entities/lead';

/**
 * Puerto de salida que se invoca cuando un Lead entra al estado OFERTADO. Permite
 * que otro contexto (cotizaciones) reaccione a la transición sin que el módulo de
 * leads dependa de él en tiempo de compilación. El ciclo de inyección se resuelve
 * con `forwardRef` en el wiring de módulos.
 */
export interface OfferedLeadHandlerPort {
    handle(lead: Lead): Promise<void>;
}

export const OFFERED_LEAD_HANDLER = Symbol('OFFERED_LEAD_HANDLER');
