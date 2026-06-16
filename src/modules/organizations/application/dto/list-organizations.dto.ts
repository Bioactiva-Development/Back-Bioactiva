export class ListOrganizationsDto {
    constructor(
        public readonly sector?: string,
        public readonly tamano?: string,
        public readonly tipo?: string,
        public readonly page: number = 1,
        public readonly limit: number = 10,
    ) {}
}
