export class UpdateLeadDto {
    constructor(
        public readonly servicioInteres?: string,
        public readonly comentarios?: string | null,
        public readonly desafioOportunidad?: string | null,
        public readonly canalCaptacion?: string | null,
    ) {}
}
