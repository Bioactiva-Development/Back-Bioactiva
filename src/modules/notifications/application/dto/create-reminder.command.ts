export interface CreateReminderCommand {
    idActividad: number;
    fechaEnvio: Date;
    idTemplate: number;
    /** Copia editable del asunto/cuerpo de la plantilla para este envío. */
    asunto: string;
    cuerpo: string;
}
