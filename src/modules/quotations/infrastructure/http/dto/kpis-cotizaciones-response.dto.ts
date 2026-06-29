import { ApiProperty } from '@nestjs/swagger';
import type { CotizacionKpis } from '@/modules/quotations/domain/ports/cotizacion-repository.port';

export class KpisCotizacionesResponseDto implements CotizacionKpis {
    @ApiProperty({
        description: 'Suma de montos de cotizaciones no rechazadas (PENDIENTE + ENVIADA + ACEPTADA)',
        example: 15000.5,
    })
    totalActivo: number;

    @ApiProperty({ description: 'Cantidad de cotizaciones aceptadas', example: 3 })
    aceptadas: number;

    @ApiProperty({ description: 'Cantidad de cotizaciones enviadas', example: 5 })
    enviadas: number;

    @ApiProperty({ description: 'Cantidad de cotizaciones rechazadas', example: 2 })
    rechazadas: number;

    constructor(kpis: CotizacionKpis) {
        this.totalActivo = kpis.totalActivo;
        this.aceptadas = kpis.aceptadas;
        this.enviadas = kpis.enviadas;
        this.rechazadas = kpis.rechazadas;
    }
}
