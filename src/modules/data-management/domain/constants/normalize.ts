/**
 * Normaliza un valor de celda de Excel para poder compararlo contra los mapas de
 * sinónimos sin depender de mayúsculas, acentos, espacios extra ni punto final
 * (los vocativos del Excel llegan como "Sr.", "Dra.", etc.).
 */
export function normalizeCell(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '') // elimina diacríticos (tildes, diéresis)
        .replace(/\.$/, '') // quita el punto final ("sr." -> "sr")
        .replace(/\s+/g, ' '); // colapsa espacios internos
}
