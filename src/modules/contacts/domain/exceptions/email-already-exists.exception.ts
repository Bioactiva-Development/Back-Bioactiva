export class EmailAlreadyExistsException extends Error {
    constructor(email: string) {
        super(`El correo electrónico '${email}' ya se encuentra registrado en el sistema.`);
        this.name = 'EmailAlreadyExistsException';
    }
}