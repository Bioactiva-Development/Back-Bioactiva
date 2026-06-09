import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';

export const EMAIL_TEMPLATE_REPOSITORY = Symbol('EMAIL_TEMPLATE_REPOSITORY');

/** Gestión completa de plantillas de correo (CU011). */
export interface EmailTemplateRepositoryPort {
    create(template: EmailTemplate): Promise<EmailTemplate>;
    save(template: EmailTemplate): Promise<EmailTemplate>;
    findById(id: number): Promise<EmailTemplate | null>;
    findByName(nombre: string): Promise<EmailTemplate | null>;
    list(includeInactive: boolean): Promise<EmailTemplate[]>;
    delete(id: number): Promise<void>;
    /** ¿Alguna notificación referencia esta plantilla? (bloquea el borrado) */
    isUsedByNotification(id: number): Promise<boolean>;
}
