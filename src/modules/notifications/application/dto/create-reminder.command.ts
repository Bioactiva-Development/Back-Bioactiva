export interface CreateReminderCommand {
    idLead: number;
    fechaEnvio: Date;
    /** Plantilla opcional: si se omite, el asunto/cuerpo son escritos a mano. */
    idTemplate: number | null;
    /** Copia editable del asunto/cuerpo (de la plantilla o manual) para este envío. */
    asunto: string;
    cuerpo: string;
}
