export interface FollowUpEmailInput {
    fechaEnvio: Date;
    idTemplate: number;
    asunto: string;
    cuerpo: string;
}

export interface FollowUpInstanceCommand {
    internal: FollowUpEmailInput;
    external: FollowUpEmailInput;
}

export interface CreateFollowUpCommand {
    idActividad: number;
    /** Mismo destinatario del cliente para todas las instancias. */
    correoCliente: string;
    /** Entre 1 y 3 instancias escalonadas. */
    instancias: FollowUpInstanceCommand[];
}
