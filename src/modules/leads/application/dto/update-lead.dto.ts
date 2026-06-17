export class UpdateLeadDto {
    constructor(
        public readonly idOrg?: string,
        public readonly idContacto?: number | null,
        public readonly servicioInteres?: string,
        public readonly comentarios?: string | null,
        public readonly desafioOportunidad?: string | null,
        public readonly canalCaptacion?: string | null,
        public readonly idEncargado?: number,
    ) {}
}
