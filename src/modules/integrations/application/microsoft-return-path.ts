/**
 * Destino al que se redirige al usuario tras el OAuth de Microsoft. Se acepta
 * una ruta interna relativa (p. ej. "/notificaciones" o "/ajustes") y se sanea
 * para evitar open-redirects a dominios externos. Si la entrada no es válida,
 * se usa la ruta por defecto.
 */
export const DEFAULT_RETURN_PATH = '/ajustes';

export function sanitizeReturnPath(input?: string | null): string {
    if (!input) {
        return DEFAULT_RETURN_PATH;
    }
    // Solo rutas internas: debe empezar por "/" y no ser protocol-relative ("//").
    if (!input.startsWith('/') || input.startsWith('//')) {
        return DEFAULT_RETURN_PATH;
    }
    // Evita esquemas (javascript:, http:) y separadores de Windows.
    if (input.includes(':') || input.includes('\\')) {
        return DEFAULT_RETURN_PATH;
    }
    return input;
}
