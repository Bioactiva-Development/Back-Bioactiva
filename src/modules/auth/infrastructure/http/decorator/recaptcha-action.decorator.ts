import { SetMetadata } from '@nestjs/common';

export const RECAPTCHA_ACTION_KEY = 'recaptchaAction';

/**
 * Fija la action de reCAPTCHA Enterprise esperada para el endpoint (solo
 * relevante en modo `score`; en `checkbox` la action se ignora). El frontend
 * debe generar el token con exactamente esta misma action. Los endpoints sin
 * este decorator usan la action de login (`RECAPTCHA_LOGIN_ACTION`).
 */
export const RecaptchaAction = (action: string) =>
    SetMetadata(RECAPTCHA_ACTION_KEY, action);
