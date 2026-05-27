export class InvalidResetTokenException extends Error {
    constructor(
        message = 'Token de restablecimiento de contraseña inválido o ya utilizado',
    ) {
        super(message);
        this.name = 'InvalidResetTokenException';
    }
}
