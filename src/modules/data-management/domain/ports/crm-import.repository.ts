import {
    ImportPlan,
    ImportSummary,
} from '@/modules/data-management/application/dto/import-types';

export interface IImportCommitRepository {
    /**
     * Inserta el plan completo en una sola transacción, en orden
     * Organizaciones → Contactos → Leads (+ Actividad) → Cotizaciones,
     * resolviendo relaciones por clave natural y omitiendo duplicados
     * (insert-only). Devuelve el resumen de insertados / omitidos / avisos.
     */
    commit(
        plan: ImportPlan,
        ctx: { authorUserId: number },
    ): Promise<ImportSummary>;
}

export const CRM_IMPORT_REPOSITORY = Symbol('CRM_IMPORT_REPOSITORY');
