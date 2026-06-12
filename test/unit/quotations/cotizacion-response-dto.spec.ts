import { describe, expect, it } from '@jest/globals';
import { CotizacionResponseDto } from '@/modules/quotations/infrastructure/http/dto/cotizacion-response.dto';
import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';

describe('Quotations module', () => {
    describe('CotizacionResponseDto', () => {
        const buildEnriched = () => ({
            cotizacion: new Cotizacion(
                1,
                new Date('2026-06-01T10:00:00.000Z'),
                'Dr. Martinez',
                'TechCorp SA',
                'Licencia Pro',
                'Juan Perez',
                'Desarrollo',
                '5000.00',
                TipoMoneda.USD,
                EstadoCot.PENDIENTE,
                'Incluye soporte',
                'https://prop/cot-001',
                10,
                7,
                3,
                new Date('2026-01-01T00:00:00.000Z'),
                new Date('2026-01-02T00:00:00.000Z'),
                null,
            ),
            leadServicioInteres: 'Consultoría',
            leadEstado: 'EN_PROSPECTO',
            contactName: 'María Gómez',
            remitenteNombre: 'Carlos',
            remitenteApellidos: 'López',
        });

        it('maps every field from the enriched cotizacion', () => {
            const dto = new CotizacionResponseDto(buildEnriched());

            expect(dto.id).toBe(1);
            expect(dto.dirigido).toBe('Dr. Martinez');
            expect(dto.cliente).toBe('TechCorp SA');
            expect(dto.producto).toBe('Licencia Pro');
            expect(dto.nombreRemitente).toBe('Juan Perez');
            expect(dto.nombreServicio).toBe('Desarrollo');
            expect(dto.monto).toBe('5000.00');
            expect(dto.tipo).toBe(TipoMoneda.USD);
            expect(dto.estado).toBe(EstadoCot.PENDIENTE);
            expect(dto.observacion).toBe('Incluye soporte');
            expect(dto.linkPropuesta).toBe('https://prop/cot-001');
            expect(dto.idLead).toBe(10);
            expect(dto.leadServicioInteres).toBe('Consultoría');
            expect(dto.leadEstado).toBe('EN_PROSPECTO');
            expect(dto.contactName).toBe('María Gómez');
            expect(dto.idRemitente).toBe(7);
            expect(dto.remitenteName).toBe('Carlos López');
            expect(dto.idAuthor).toBe(3);
        });

        it('builds remitenteName trimmed when apellidos is empty', () => {
            const enriched = buildEnriched();
            enriched.remitenteApellidos = '';
            const dto = new CotizacionResponseDto(enriched);
            expect(dto.remitenteName).toBe('Carlos');
        });
    });
});
