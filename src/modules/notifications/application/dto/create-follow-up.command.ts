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
    /** Destinatario del cliente de la instancia. */
    correoCliente: string;
    /** Una única instancia de seguimiento. */
    instancias: FollowUpInstanceCommand[];
}
