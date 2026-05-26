export class OrganizationAlreadyExistsException extends Error {
    constructor(ruc: string) {
        super(`La organización con ruc ${ruc} ya se encuentra registrada.`);
        this.name = 'OrganizationAlreadyExistsException';
    }
}
