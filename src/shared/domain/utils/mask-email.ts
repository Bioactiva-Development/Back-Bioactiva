/**
 * Anonimiza un correo dejando visible solo la primera (y, si hay espacio, la
 * última) letra de la parte local, conservando el dominio.
 *
 * Ejemplos:
 *   "john.doe@bioactiva.com" -> "j******e@bioactiva.com"
 *   "ab@bioactiva.com"       -> "a*@bioactiva.com"
 *   "a@bioactiva.com"        -> "a@bioactiva.com"
 */
export function maskEmail(correo: string): string {
    const [localPart, domain] = correo.split('@');
    const maskedLocalPart =
        localPart.length <= 2
            ? localPart[0] + '*'.repeat(localPart.length - 1)
            : localPart[0] +
              '*'.repeat(localPart.length - 2) +
              localPart.slice(-1);
    return maskedLocalPart + '@' + domain;
}
