export interface FollowUpEmailInput {
    fechaEnvio: Date;
    /** Plantilla opcional: si se omite, el asunto/cuerpo son escritos a mano. */
    idTemplate: number | null;
    asunto: string;
    cuerpo: string;
}

export interface CreateFollowUpCommand {
    idLead: number;
    internal: FollowUpEmailInput;
    external: FollowUpEmailInput & { correoCliente: string };
}
