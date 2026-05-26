export class OrganizationAlreadyExistsException extends Error {
    constructor(ruc: string) {
        super(`La organización ya se encuentra registrada.`);
        this.name = 'OrganizationAlreadyExistsException';
    }
}
