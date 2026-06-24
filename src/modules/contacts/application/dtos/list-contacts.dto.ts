export class ListContactsDto {
    constructor(
        public readonly search?: string,
        public readonly page: number = 1,
        public readonly limit: number = 10,
    ) {}
}
