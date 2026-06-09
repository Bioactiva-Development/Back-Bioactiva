export interface CreateEmailTemplateCommand {
    nombre: string;
    asunto: string;
    cuerpo: string;
    activo?: boolean;
}
