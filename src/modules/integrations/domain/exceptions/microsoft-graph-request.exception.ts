/**
 * Error de una operación contra Microsoft Graph (calendario / Teams).
 *
 * No extiende DomainException a propósito: estas fallas son internas de la
 * integración y deben capturarse en la capa de aplicación sin afectar la
 * operación del CRM (RN-003). Nunca se propagan al GlobalExceptionFilter.
 */
export class MicrosoftGraphRequestException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MicrosoftGraphRequestException';
    }
}
