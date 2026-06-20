/**
 * Formatea un instante absoluto (`Date`, siempre UTC internamente) como fecha y
 * hora civil en una zona IANA concreta. Se usa para mostrar fechas al usuario en
 * su zona de negocio (ver `AppTimeConfig`), sin alterar el instante almacenado.
 *
 * Ej.: `2026-01-01T05:00:00Z` en `America/Lima` → `01/01/2026, 00:00`.
 */
export function formatDateTimeInZone(
    date: Date,
    timeZone: string,
    locale = 'es-PE',
): string {
    return new Intl.DateTimeFormat(locale, {
        timeZone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
}
