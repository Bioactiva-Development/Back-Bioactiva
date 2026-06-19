import { describe, expect, it, jest } from '@jest/globals';

/**
 * Cubre ramas de `plainValue` que no se pueden alcanzar haciendo un round-trip
 * real con exceljs (richText con parte sin `text`, objeto sin claves conocidas),
 * porque la propia librería rechaza o serializa esos valores al escribir. Aquí se
 * mockea `exceljs` para inyectar el `cell.value` exacto en el lector.
 */

interface FakeCell {
    value: unknown;
}

// Estado compartido que el mock de Workbook leerá en read().
const fakeState: {
    sheetName: string;
    headerCells: { col: number; cell: FakeCell }[];
    dataRows: { rowNumber: number; cells: Record<number, FakeCell> }[];
} = { sheetName: 'Hoja1', headerCells: [], dataRows: [] };

jest.mock('exceljs', () => {
    class Workbook {
        xlsx = {
            load: jest.fn(async () => undefined),
        };

        eachSheet(cb: (ws: unknown) => void): void {
            const worksheet = {
                name: fakeState.sheetName,
                getRow: (n: number) => {
                    if (n === 1) {
                        return {
                            eachCell: (
                                fn: (cell: FakeCell, col: number) => void,
                            ) => {
                                for (const h of fakeState.headerCells) {
                                    fn(h.cell, h.col);
                                }
                            },
                        };
                    }
                    return { eachCell: () => undefined };
                },
                eachRow: (
                    fn: (row: unknown, rowNumber: number) => void,
                ) => {
                    // fila 1 = cabecera
                    fn({ getCell: () => ({ value: 'header' }) }, 1);
                    for (const r of fakeState.dataRows) {
                        fn(
                            {
                                getCell: (col: number) =>
                                    r.cells[col] ?? { value: null },
                            },
                            r.rowNumber,
                        );
                    }
                },
            };
            cb(worksheet);
        }
    }
    return { Workbook };
});

// Import AFTER the mock so the adapter picks up the mocked Workbook.
import { ExceljsReader } from '@/modules/data-management/infrastructure/excel/exceljs-reader.adapter';

describe('ExceljsReader plainValue edge branches (mocked exceljs)', () => {
    const reader = new ExceljsReader();

    it('should join richText parts, defaulting missing text to empty string', async () => {
        fakeState.headerCells = [{ col: 1, cell: { value: 'Rico' } }];
        fakeState.dataRows = [
            {
                rowNumber: 2,
                cells: {
                    1: {
                        value: {
                            richText: [{ text: 'Solo' }, {}],
                        },
                    },
                },
            },
        ];

        const parsed = await reader.read(Buffer.from(''));
        // 'Solo' + '' (parte sin text) => 'Solo'
        expect(parsed['Hoja1'][0]['rico']).toBe('Solo');
    });

    it('should treat an object without text/result/richText as null and drop empty rows', async () => {
        fakeState.headerCells = [
            { col: 1, cell: { value: 'Nombre' } },
            { col: 2, cell: { value: 'Raro' } },
        ];
        fakeState.dataRows = [
            {
                rowNumber: 2,
                cells: {
                    1: { value: 'Ana' },
                    2: { value: { other: 'x' } },
                },
            },
            {
                // fila totalmente vacía => se descarta (hasData=false)
                rowNumber: 3,
                cells: {
                    1: { value: null },
                    2: { value: { foo: 'bar' } },
                },
            },
        ];

        const parsed = await reader.read(Buffer.from(''));
        expect(parsed['Hoja1']).toHaveLength(1);
        expect(parsed['Hoja1'][0]['nombre']).toBe('Ana');
        expect(parsed['Hoja1'][0]['raro']).toBeNull();
    });
});
