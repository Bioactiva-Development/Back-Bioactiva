export interface CreateReminderCommand {
    idLead: number;
    /** Minutos antes de la fechaFin de la actividad en que se envía (1–120). */
    minutosAntes: number;
    /** Plantilla opcional: si se omite, el asunto/cuerpo son escritos a mano. */
    idTemplate: number | null;
    /** Copia editable del asunto/cuerpo (de la plantilla o manual) para este envío. */
    asunto: string;
    cuerpo: string;
}
