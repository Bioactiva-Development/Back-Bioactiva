export class OrganizationAlreadyExistsException extends Error {
    constructor(ruc: string) {
        super(`La organización con el RUC '${ruc}' ya se encuentra registrada.`);
        this.name = 'OrganizationAlreadyExistsException';
    }
}
