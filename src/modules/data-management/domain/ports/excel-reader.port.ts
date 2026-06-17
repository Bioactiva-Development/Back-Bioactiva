/**
 * Una fila parseada: las claves son los encabezados de la hoja ya normalizados
 * (minúsculas, sin acentos ni punto final) y los valores son primitivos
 * (string | number | Date | null).
 */
export type ParsedRow = Record<string, unknown>;

/** Libro parseado: nombre de hoja (tal cual) -> filas de datos (sin la cabecera). */
export type ParsedWorkbook = Record<string, ParsedRow[]>;

export interface IExcelReader {
    read(buffer: Buffer): Promise<ParsedWorkbook>;
}

export const EXCEL_READER = Symbol('EXCEL_READER');
