export class ResetTokenExpiredException extends Error {
    constructor(
        message = 'El token de restablecimiento de contraseña ha expirado',
    ) {
        super(message);
        this.name = 'ResetTokenExpiredException';
    }
}
