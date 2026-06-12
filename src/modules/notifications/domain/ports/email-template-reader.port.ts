export const EMAIL_TEMPLATE_READER = Symbol('EMAIL_TEMPLATE_READER');

export interface EmailTemplate {
    id: number;
    nombre: string;
    asunto: string;
    cuerpo: string;
    activo: boolean;
}

/**
 * Lectura de plantillas de correo (CU011). En esta fase solo se exponen las
 * operaciones necesarias para el selector de notificaciones; el CRUD completo de
 * plantillas se implementa por separado.
 */
export interface EmailTemplateReaderPort {
    listActive(): Promise<EmailTemplate[]>;
    findActiveById(id: number): Promise<EmailTemplate | null>;
}
