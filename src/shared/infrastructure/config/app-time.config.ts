import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Zona horaria de negocio por defecto (Perú, UTC-5 sin horario de verano). */
export const DEFAULT_APP_TIMEZONE = 'America/Lima';

/**
 * Expone la zona horaria de negocio de la aplicación, configurable vía
 * `APP_TIMEZONE`. Se usa para razonar sobre hora civil (p. ej. mostrar fechas
 * al usuario en su zona local). Los instantes absolutos —scheduling en BullMQ,
 * persistencia en Prisma, eventos de Microsoft Graph— siguen trabajando en UTC
 * y no dependen de este valor.
 *
 * La zona se valida en el arranque: si `APP_TIMEZONE` no es una zona IANA
 * válida, el provider falla al instanciarse y la app no levanta.
 */
@Injectable()
export class AppTimeConfig {
    private readonly _timeZone: string;

    constructor(private readonly configService: ConfigService) {
        const tz = this.configService.get<string>(
            'APP_TIMEZONE',
            DEFAULT_APP_TIMEZONE,
        );
        if (!AppTimeConfig.isValidTimeZone(tz)) {
            throw new Error(
                `APP_TIMEZONE inválida: "${tz}". Debe ser una zona IANA válida (ej. "America/Lima").`,
            );
        }
        this._timeZone = tz;
    }

    get timeZone(): string {
        return this._timeZone;
    }

    private static isValidTimeZone(tz: string): boolean {
        if (!tz) {
            return false;
        }
        try {
            new Intl.DateTimeFormat('en-US', { timeZone: tz });
            return true;
        } catch {
            return false;
        }
    }
}
