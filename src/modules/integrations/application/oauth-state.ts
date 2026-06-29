import { createHmac, timingSafeEqual } from 'node:crypto';

// El secret se resuelve en el primer uso (lazy) para que ConfigModule tenga
// tiempo de cargar el .env antes de que este módulo intente leerlo.
let STATE_SECRET: string | undefined;

function getStateSecret(): string {
    if (!STATE_SECRET) {
        const secret =
            process.env.MICROSOFT_STATE_SECRET ?? process.env.JWT_SECRET;
        if (!secret) {
            throw new Error(
                'Falta MICROSOFT_STATE_SECRET (o JWT_SECRET como fallback) — requerido para firmar el OAuth state',
            );
        }
        STATE_SECRET = secret;
    }
    return STATE_SECRET;
}

/** Firma el payload del state OAuth con HMAC-SHA256. */
export function signOAuthState(payload: string): string {
    return createHmac('sha256', getStateSecret()).update(payload).digest('hex');
}

/**
 * Verifica la firma del state y devuelve el userId embebido, o null si el
 * state es inválido o fue manipulado.
 * Formato esperado: `${userId}:${nonce}:${encodedReturnPath}:${hmac}`
 */
export function verifyOAuthState(state: string): number | null {
    const lastColon = state.lastIndexOf(':');
    if (lastColon === -1) return null;
    const payload = state.slice(0, lastColon);
    const sig = state.slice(lastColon + 1);
    const expected = signOAuthState(payload);
    try {
        const sigBuf = Buffer.from(sig, 'hex');
        const expBuf = Buffer.from(expected, 'hex');
        if (sigBuf.length !== expBuf.length) return null;
        if (!timingSafeEqual(sigBuf, expBuf)) return null;
    } catch {
        return null;
    }
    const userId = Number.parseInt(payload.split(':')[0], 10);
    return Number.isNaN(userId) ? null : userId;
}
