/**
 * Definición de una columna de una hoja de cálculo.
 * `key` debe coincidir con una propiedad de los objetos `rows`.
 */
export interface SheetColumn {
    header: string;
    key: string;
    width?: number;
    /**
     * Texto de ayuda que se adjunta como comentario a la celda del encabezado
     * (se ve al pasar el cursor). Útil para ejemplos e indicaciones en plantillas.
     */
    note?: string;
    /** Resalta el encabezado para señalar que la columna es obligatoria. */
    required?: boolean;
    /**
     * Valores permitidos: genera una lista desplegable (validación de datos) en
     * las filas de la columna. La validación es de tipo aviso, no bloqueante:
     * el usuario puede escribir equivalentes que el importador igual reconoce.
     */
    dropdown?: string[];
}

/** Definición de una hoja: nombre, columnas y filas (objetos planos por `key`). */
export interface SheetDefinition {
    name: string;
    columns: SheetColumn[];
    rows: Record<string, unknown>[];
    /**
     * Predicado opcional: si devuelve `true` para una fila, esa fila se resalta
     * (registros no vigentes / desactivados, p. ej. organizaciones con
     * `deletedAt`). Cumple el requisito del acta de avisar al exportar datos no
     * vigentes.
     */
    highlightWhen?: (row: Record<string, unknown>) => boolean;
}

/**
 * Puerto para construir un libro de Excel (`.xlsx`) a partir de definiciones de
 * hojas. Aísla la librería de Excel (exceljs) de la capa de aplicación.
 */
export interface IWorkbookBuilder {
    build(sheets: SheetDefinition[]): Promise<Buffer>;
}

export const WORKBOOK_BUILDER = Symbol('WORKBOOK_BUILDER');
