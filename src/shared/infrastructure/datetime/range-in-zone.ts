/**
 * Conversión de fechas civiles (calendario) de una zona IANA a instantes UTC.
 *
 * Motivación: el negocio razona en hora civil de Perú (`America/Lima`, UTC-5),
 * pero `new Date("2026-06-22")` ancla la fecha a la medianoche **UTC**, no a la
 * medianoche de Lima. Eso desfasa los rangos ~5 h y, combinado con un `lte`
 * sobre la medianoche, excluye todo el último día seleccionado (el clásico
 * off-by-one que ya se parcheó en el frontend).
 *
 * Estas funciones interpretan una fecha **sin hora** (`YYYY-MM-DD`) como el día
 * civil completo en la zona indicada. Si el valor ya trae hora (ISO con `T`),
 * se respeta como instante absoluto y se devuelve tal cual.
 */

/** Solo fecha, sin componente horario: `2026-06-22`. */
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Offset (en ms) tal que `instante + offset = hora de pared en la zona`.
 * Para `America/Lima` es siempre -5 h (sin horario de verano).
 */
function zoneOffsetMs(timeZone: string, instant: Date): number {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).formatToParts(instant);
    const get = (type: string): number =>
        Number(parts.find((p) => p.type === type)?.value);
    const wallAsUtc = Date.UTC(
        get('year'),
        get('month') - 1,
        get('day'),
        get('hour'),
        get('minute'),
        get('second'),
    );
    // `formatToParts` trunca a segundos, así que comparar contra el instante con
    // milisegundos arrastraría ese resto al offset. Los offsets de zona siempre
    // son minutos enteros: redondeamos al minuto para obtener uno limpio.
    return Math.round((wallAsUtc - instant.getTime()) / 60000) * 60000;
}

/**
 * Devuelve el instante UTC que corresponde a una hora de pared concreta
 * (`y-mo-d hh:mi:ss.ms`) en la zona indicada.
 */
function wallTimeToUtc(
    y: number,
    mo: number,
    d: number,
    hh: number,
    mi: number,
    ss: number,
    ms: number,
    timeZone: string,
): Date {
    const guess = Date.UTC(y, mo - 1, d, hh, mi, ss, ms);
    const offset = zoneOffsetMs(timeZone, new Date(guess));
    return new Date(guess - offset);
}

/** Componentes de la fecha y hora civil (zona) de un instante absoluto. */
function civilDateParts(
    instant: Date,
    timeZone: string,
): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).formatToParts(instant);
    const get = (type: string): number =>
        Number(parts.find((p) => p.type === type)?.value);
    return {
        year: get('year'),
        month: get('month'),
        day: get('day'),
        hour: get('hour'),
        minute: get('minute'),
        second: get('second'),
    };
}

/**
 * Inicio (00:00:00.000) del día civil de la zona. Para rangos `fechaDesde`.
 * - `2026-06-22`           → `2026-06-22T05:00:00.000Z` (medianoche en Lima)
 * - `2026-06-22T10:00:00Z` → se respeta el instante (`new Date`).
 */
export function startOfDayInZone(input: string, timeZone: string): Date {
    if (DATE_ONLY_RE.test(input)) {
        const [y, mo, d] = input.split('-').map(Number);
        return wallTimeToUtc(y, mo, d, 0, 0, 0, 0, timeZone);
    }
    return new Date(input);
}

/**
 * Fin (23:59:59.999) del día civil de la zona. Para rangos `fechaHasta`: así el
 * filtro `lte` incluye todo el día seleccionado en vez de cortarlo a medianoche.
 * - `2026-06-22`           → `2026-06-23T04:59:59.999Z`
 * - `2026-06-22T10:00:00Z` → se respeta el instante (`new Date`).
 */
export function endOfDayInZone(input: string, timeZone: string): Date {
    if (DATE_ONLY_RE.test(input)) {
        const [y, mo, d] = input.split('-').map(Number);
        return wallTimeToUtc(y, mo, d, 23, 59, 59, 999, timeZone);
    }
    return new Date(input);
}

/**
 * Inicio del día civil (zona) que contiene al instante dado. Útil para reglas
 * tipo "no anterior a hoy" sin depender de la zona del proceso (que es UTC).
 */
export function startOfCurrentDayInZone(instant: Date, timeZone: string): Date {
    const { year, month, day } = civilDateParts(instant, timeZone);
    return wallTimeToUtc(year, month, day, 0, 0, 0, 0, timeZone);
}

/**
 * Instante exacto (zona) que corresponde al instante dado. Útil para reglas
 * tipo "no anterior al momento actual" razonando en la zona de negocio.
 * Los milisegundos se preservan directamente del instante original porque
 * `formatToParts` trunca a segundos.
 */
export function exactTimeInZone(instant: Date, timeZone: string): Date {
    const { year, month, day, hour, minute, second } = civilDateParts(
        instant,
        timeZone,
    );
    return wallTimeToUtc(
        year,
        month,
        day,
        hour,
        minute,
        second,
        instant.getMilliseconds(),
        timeZone,
    );
}
