import { MicrosoftOAuthFailedException } from '@/modules/integrations/domain/exceptions/microsoft-oauth-failed.exception';

/**
 * Se lanza cuando el refresh token de Microsoft ya no es utilizable: expiró por
 * inactividad (~90 días) o fue revocado (cambio de contraseña, MFA, política de
 * Conditional Access, revocación del admin). A diferencia de un fallo transitorio
 * (red, 5xx), este error es terminal: el usuario DEBE volver a conectar su cuenta.
 *
 * Extiende MicrosoftOAuthFailedException para conservar el mapeo HTTP existente y
 * para que los `instanceof MicrosoftOAuthFailedException` previos lo sigan tratando
 * como un fallo de OAuth.
 */
export class MicrosoftRefreshTokenInvalidException extends MicrosoftOAuthFailedException {
    constructor(message: string) {
        super(message);
    }
}
