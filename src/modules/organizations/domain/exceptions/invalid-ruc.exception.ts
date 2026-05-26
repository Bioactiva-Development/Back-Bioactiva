export class InvalidRucException extends Error {
    constructor(ruc: string, message?: string) {
        super(message || `El RUC '${ruc}' no es válido o no existe en SUNAT.`);
        this.name = 'InvalidRucException';
    }
}
