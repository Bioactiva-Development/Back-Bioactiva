export const STALE_LEAD_READER = Symbol('STALE_LEAD_READER');

export interface StaleLead {
    idLead: number;
    idEncargado: number;
    ultimoCambioEstado: Date;
}

/**
 * Lee leads abiertos (no cerrados) cuyo último cambio de estado supera el umbral
 * de días, para la alerta automática de inactividad (CU007).
 */
export interface StaleLeadReaderPort {
    getStaleLeads(thresholdDays: number): Promise<StaleLead[]>;
}
