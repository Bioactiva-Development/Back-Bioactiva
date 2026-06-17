/**
 * Instancia de un SEGUIMIENTO (CU007). Cada seguimiento agrupa de 1 a 3
 * instancias escalonadas. Cada instancia envía primero un correo interno al
 * responsable de la actividad y, después, uno externo al cliente. Conserva una
 * copia editable del asunto/cuerpo por envío (la plantilla original no se muta).
 */
export class FollowUpInstance {
    constructor(
        public readonly id: number | null,
        public orden: number,
        public asunto_interno: string,
        public cuerpo_interno: string,
        public fecha_envio_interno: Date,
        public id_template_interno: number | null,
        public job_id_interno: string | null,
        public enviado_interno: boolean,
        public asunto_externo: string,
        public cuerpo_externo: string,
        public fecha_envio_externo: Date,
        public id_template_externo: number | null,
        public job_id_externo: string | null,
        public enviado_externo: boolean,
    ) {}

    static create(input: {
        orden: number;
        internal: {
            asunto: string;
            cuerpo: string;
            fechaEnvio: Date;
            idTemplate: number | null;
        };
        external: {
            asunto: string;
            cuerpo: string;
            fechaEnvio: Date;
            idTemplate: number | null;
        };
    }): FollowUpInstance {
        return new FollowUpInstance(
            null,
            input.orden,
            input.internal.asunto,
            input.internal.cuerpo,
            input.internal.fechaEnvio,
            input.internal.idTemplate,
            null,
            false,
            input.external.asunto,
            input.external.cuerpo,
            input.external.fechaEnvio,
            input.external.idTemplate,
            null,
            false,
        );
    }

    assignInternalJob(jobId: string): void {
        this.job_id_interno = jobId;
    }

    assignExternalJob(jobId: string): void {
        this.job_id_externo = jobId;
    }

    markInternalSent(): void {
        this.enviado_interno = true;
    }

    markExternalSent(): void {
        this.enviado_externo = true;
    }

    hasPendingInternal(): boolean {
        return !this.enviado_interno;
    }

    hasPendingExternal(): boolean {
        return !this.enviado_externo;
    }

    isFullySent(): boolean {
        return this.enviado_interno && this.enviado_externo;
    }
}
