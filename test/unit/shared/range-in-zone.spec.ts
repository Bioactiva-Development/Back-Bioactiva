import { describe, expect, it } from '@jest/globals';
import {
    startOfDayInZone,
    endOfDayInZone,
    startOfCurrentDayInZone,
} from '@/shared/infrastructure/datetime/range-in-zone';

const LIMA = 'America/Lima'; // UTC-5, sin horario de verano

describe('range-in-zone', () => {
    describe('startOfDayInZone', () => {
        it('interpreta una fecha solo-fecha como medianoche en la zona (no UTC)', () => {
            const result = startOfDayInZone('2026-06-22', LIMA);
            // Medianoche en Lima (UTC-5) = 05:00 UTC del mismo día.
            expect(result.toISOString()).toBe('2026-06-22T05:00:00.000Z');
        });

        it('respeta un instante ISO con hora tal cual', () => {
            const iso = '2026-06-22T10:30:00.000Z';
            expect(startOfDayInZone(iso, LIMA).toISOString()).toBe(iso);
        });
    });

    describe('endOfDayInZone', () => {
        it('incluye todo el último día (fin de día en la zona)', () => {
            const result = endOfDayInZone('2026-06-22', LIMA);
            // 23:59:59.999 en Lima = 04:59:59.999 UTC del día siguiente.
            expect(result.toISOString()).toBe('2026-06-23T04:59:59.999Z');
        });

        it('una cotización creada a las 23:00 hora Lima del día filtrado queda dentro del rango', () => {
            // 23:00 Lima del 22 = 04:00 UTC del 23.
            const cotizacion = new Date('2026-06-23T04:00:00.000Z');
            const desde = startOfDayInZone('2026-06-22', LIMA);
            const hasta = endOfDayInZone('2026-06-22', LIMA);
            expect(cotizacion >= desde && cotizacion <= hasta).toBe(true);
        });
    });

    describe('startOfCurrentDayInZone', () => {
        it('a las 02:00 UTC (aún día anterior en Lima) devuelve el inicio del día civil correcto', () => {
            // 2026-06-22T02:00Z = 2026-06-21 21:00 en Lima → inicio del 21.
            const instant = new Date('2026-06-22T02:00:00.000Z');
            expect(startOfCurrentDayInZone(instant, LIMA).toISOString()).toBe(
                '2026-06-21T05:00:00.000Z',
            );
        });

        it('a las 12:00 UTC (mismo día en Lima) devuelve el inicio de ese día', () => {
            const instant = new Date('2026-06-22T12:00:00.000Z');
            expect(startOfCurrentDayInZone(instant, LIMA).toISOString()).toBe(
                '2026-06-22T05:00:00.000Z',
            );
        });
    });
});
