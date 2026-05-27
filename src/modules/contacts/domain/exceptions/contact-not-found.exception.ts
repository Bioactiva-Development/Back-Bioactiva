export class ContactNotFoundException extends Error {
    constructor(id: number) {
        super(`El contacto con ID '${id}' no fue encontrado.`);
        this.name = 'ContactNotFoundException';
    }
}
