export interface FollowUpEmailInput {
    fechaEnvio: Date;
    idTemplate: number;
    asunto: string;
    cuerpo: string;
}

export interface CreateFollowUpCommand {
    idActividad: number;
    internal: FollowUpEmailInput;
    external: FollowUpEmailInput & { correoCliente: string };
}
