/**
 * Normaliza un valor de celda de Excel para poder compararlo contra los mapas de
 * sinónimos sin depender de mayúsculas, acentos, espacios extra ni punto final
 * (los vocativos del Excel llegan como "Sr.", "Dra.", etc.).
 */
export function normalizeCell(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'object' && !(value instanceof Date)) {
        return '';
    }
    return String(value)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replaceAll(/\p{Diacritic}/gu, '')
        .replace(/\.$/, '')
        .replaceAll(/\s+/g, ' ');
}
