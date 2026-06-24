import { describe, expect, it } from '@jest/globals';
import { CotizacionMapper } from '@/modules/quotations/infrastructure/mappers/cotizacion.mapper';
import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';

describe('Quotations module', () => {
    describe('CotizacionMapper', () => {
        describe('mapState', () => {
            it('maps every prisma state to the domain enum', () => {
                expect(CotizacionMapper.mapState('PENDIENTE')).toBe(
                    EstadoCot.PENDIENTE,
                );
                expect(CotizacionMapper.mapState('ENVIADA')).toBe(
                    EstadoCot.ENVIADA,
                );
                expect(CotizacionMapper.mapState('ACEPTADA')).toBe(
                    EstadoCot.ACEPTADA,
                );
                expect(CotizacionMapper.mapState('RECHAZADA')).toBe(
                    EstadoCot.RECHAZADA,
                );
            });
        });

        describe('mapStateToPrisma', () => {
            it('maps every domain state back to prisma', () => {
                expect(
                    CotizacionMapper.mapStateToPrisma(EstadoCot.PENDIENTE),
                ).toBe('PENDIENTE');
                expect(
                    CotizacionMapper.mapStateToPrisma(EstadoCot.ENVIADA),
                ).toBe('ENVIADA');
                expect(
                    CotizacionMapper.mapStateToPrisma(EstadoCot.ACEPTADA),
                ).toBe('ACEPTADA');
                expect(
                    CotizacionMapper.mapStateToPrisma(EstadoCot.RECHAZADA),
                ).toBe('RECHAZADA');
            });
        });

        describe('mapType / mapTypeToPrisma', () => {
            it('maps every prisma currency to the domain enum', () => {
                expect(CotizacionMapper.mapType('PEN')).toBe(TipoMoneda.PEN);
                expect(CotizacionMapper.mapType('USD')).toBe(TipoMoneda.USD);
            });

            it('maps every domain currency back to prisma', () => {
                expect(CotizacionMapper.mapTypeToPrisma(TipoMoneda.PEN)).toBe(
                    'PEN',
                );
                expect(CotizacionMapper.mapTypeToPrisma(TipoMoneda.USD)).toBe(
                    'USD',
                );
            });
        });

        describe('toDomain', () => {
            it('maps a prisma record into a domain Cotizacion, stringifying monto', () => {
                const record = {
                    id: 5,
                    fechaCot: new Date('2026-02-01T00:00:00.000Z'),
                    dirigido: 'Dr. Martinez',
                    cliente: 'TechCorp SA',
                    producto: 'Licencia',
                    nombreRemitente: 'Juan Perez',
                    nombreServicio: 'Desarrollo',
                    monto: { toString: () => '5000.00' },
                    tipo: 'PEN',
                    estado: 'ENVIADA',
                    observacion: null,
                    linkPropuesta: null,
                    idLead: 10,
                    idRemitente: 7,
                    idAuthor: 3,
                    createdAt: new Date('2026-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                    deletedAt: null,
                } as any;

                const domain = CotizacionMapper.toDomain(record);

                expect(domain).toBeInstanceOf(Cotizacion);
                expect(domain.id).toBe(5);
                expect(domain.monto).toBe('5000.00');
                expect(domain.tipo).toBe(TipoMoneda.PEN);
                expect(domain.estado).toBe(EstadoCot.ENVIADA);
                expect(domain.cliente).toBe('TechCorp SA');
                expect(domain.id_lead).toBe(10);
                expect(domain.id_remitente).toBe(7);
                expect(domain.id_author).toBe(3);
                expect(domain.deleted_at).toBeNull();
            });
        });

        describe('toPersistence', () => {
            it('maps a domain Cotizacion into a prisma create input with relation connects', () => {
                const cotizacion = new Cotizacion(
                    null,
                    new Date('2026-02-01T00:00:00.000Z'),
                    'Dr. Martinez',
                    'TechCorp SA',
                    'Licencia',
                    'Juan Perez',
                    'Desarrollo',
                    '5000.00',
                    TipoMoneda.USD,
                    EstadoCot.PENDIENTE,
                    'una observacion',
                    'https://link',
                    10,
                    7,
                    3,
                    new Date('2026-01-01T00:00:00.000Z'),
                    new Date('2026-01-01T00:00:00.000Z'),
                    null,
                );

                const data = CotizacionMapper.toPersistence(cotizacion) as any;

                expect(data.lead).toEqual({ connect: { id: 10 } });
                expect(data.remitente).toEqual({ connect: { id: 7 } });
                expect(data.author).toEqual({ connect: { id: 3 } });
                expect(data.nombreRemitente).toBe('Juan Perez');
                expect(data.tipo).toBe('USD');
                expect(data.estado).toBe('PENDIENTE');
                expect(data.observacion).toBe('una observacion');
                expect(data.linkPropuesta).toBe('https://link');
                expect(data.deletedAt).toBeNull();
            });
        });
    });
});
