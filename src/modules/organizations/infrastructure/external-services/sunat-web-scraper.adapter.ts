import { Injectable, Logger } from '@nestjs/common';
import { ISunatService } from '../../domain/ports/sunat.service';

@Injectable()
export class SunatWebScraperAdapter implements ISunatService {
    private readonly logger = new Logger(SunatWebScraperAdapter.name);

    async validateRuc(ruc: string): Promise<boolean> {
        this.logger.log(`Consultando RUC en portal SUNAT vía Web Scraping: ${ruc}`);

        // Regla básica para mockear: Debe tener exactamente 11 dígitos numéricos
        if (!/^\d{11}$/.test(ruc)) {
            this.logger.warn(`El RUC '${ruc}' no cumple con el formato válido de 11 dígitos.`);
            return false;
        }

        this.logger.log(`RUC '${ruc}' consultado exitosamente.`);
        return true;
    }
}
