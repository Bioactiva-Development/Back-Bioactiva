export class ListLeadsDto {
    constructor(
        public readonly estado?: string,
        public readonly idOrg?: string,
        public readonly idEncargado?: number,
        public readonly search?: string,
        public readonly page: number = 1,
        public readonly limit: number = 10,
    ) {}
}
