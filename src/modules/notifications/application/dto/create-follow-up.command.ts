export interface FollowUpEmailInput {
    fechaEnvio: Date;
    /** Plantilla opcional: si se omite, el asunto/cuerpo son escritos a mano. */
    idTemplate: number | null;
    asunto: string;
    cuerpo: string;
}

export interface FollowUpInstanceCommand {
    internal: FollowUpEmailInput;
    external: FollowUpEmailInput;
}

export interface CreateFollowUpCommand {
    /** La actividad activa (única) del lead se resuelve en el servidor. */
    idLead: number;
    /** Mismo destinatario del cliente para todas las instancias. */
    correoCliente: string;
    /** Entre 1 y 3 instancias escalonadas. */
    instancias: FollowUpInstanceCommand[];
}
