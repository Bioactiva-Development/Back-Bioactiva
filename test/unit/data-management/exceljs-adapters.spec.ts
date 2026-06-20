import { describe, expect, it } from '@jest/globals';
import { Workbook } from 'exceljs';
import { ExceljsReader } from '@/modules/data-management/infrastructure/excel/exceljs-reader.adapter';
import { ExceljsWorkbookBuilder } from '@/modules/data-management/infrastructure/excel/exceljs-workbook.builder';

describe('Data-management Excel adapters', () => {
    /**
     * ExceljsReader
     * ----------
     * Responsable de:
     * - cargar un buffer .xlsx y devolver un ParsedWorkbook
     * - extraer el valor primitivo de celdas (texto, fecha, fórmula,
     *   hipervínculo, texto enriquecido)
     * - usar la fila 1 como cabecera y normalizar sus claves
     * - descartar filas vacías y registrar el número real de fila
     */
    // STATUS: Implementación completa (lectura de libros .xlsx).
    describe('ExceljsReader', () => {
        const reader = new ExceljsReader();

        /** Genera un buffer .xlsx con la cabecera y filas indicadas. */
        async function buildBuffer(
            fill: (wb: Workbook) => void,
        ): Promise<Buffer> {
            const wb = new Workbook();
            fill(wb);
            const ab = await wb.xlsx.writeBuffer();
            return Buffer.from(ab);
        }

        it('should read headers and plain cell values', async () => {
            const buffer = await buildBuffer((wb) => {
                const ws = wb.addWorksheet('Hoja1');
                ws.getCell('A1').value = 'Nombre';
                ws.getCell('B1').value = 'Edad';
                ws.getCell('A2').value = 'Ana';
                ws.getCell('B2').value = 30;
            });

            const parsed = await reader.read(buffer);

            expect(Object.keys(parsed)).toContain('Hoja1');
            expect(parsed['Hoja1']).toHaveLength(1);
            expect(parsed['Hoja1'][0]['nombre']).toBe('Ana');
            expect(parsed['Hoja1'][0]['edad']).toBe(30);
            expect(parsed['Hoja1'][0].__rowNumber).toBe(2);
        });

        it('should skip header cells with empty normalized keys', async () => {
            const buffer = await buildBuffer((wb) => {
                const ws = wb.addWorksheet('Hoja1');
                ws.getCell('A1').value = 'Nombre';
                ws.getCell('B1').value = '   '; // se normaliza a '' => se descarta
                ws.getCell('C1').value = 'Cargo';
                ws.getCell('A2').value = 'Ana';
                ws.getCell('B2').value = 'ignored';
                ws.getCell('C2').value = 'Gerente';
            });

            const parsed = await reader.read(buffer);
            const row = parsed['Hoja1'][0];

            expect(row['nombre']).toBe('Ana');
            expect(row['cargo']).toBe('Gerente');
            // La columna B fue descartada por tener cabecera vacía.
            expect(Object.keys(row)).not.toContain('');
        });

        it('should extract Date, hyperlink, formula and richText cell values', async () => {
            const date = new Date('2024-05-01T00:00:00.000Z');
            const buffer = await buildBuffer((wb) => {
                const ws = wb.addWorksheet('Hoja1');
                ws.getCell('A1').value = 'Fecha';
                ws.getCell('B1').value = 'Link';
                ws.getCell('C1').value = 'Formula';
                ws.getCell('D1').value = 'Rico';

                ws.getCell('A2').value = date;
                ws.getCell('B2').value = {
                    text: 'Bioactiva',
                    hyperlink: 'https://bioactiva.com',
                };
                ws.getCell('C2').value = { formula: 'A2', result: 42 };
                ws.getCell('D2').value = {
                    richText: [{ text: 'Hola ' }, { text: 'mundo' }],
                };
            });

            const parsed = await reader.read(buffer);
            const row = parsed['Hoja1'][0];

            expect(row['fecha']).toBeInstanceOf(Date);
            expect(row['link']).toBe('Bioactiva');
            expect(row['formula']).toBe(42);
            expect(row['rico']).toBe('Hola mundo');
        });

        it('should drop fully empty data rows', async () => {
            const buffer = await buildBuffer((wb) => {
                const ws = wb.addWorksheet('Hoja1');
                ws.getCell('A1').value = 'Nombre';
                ws.getCell('A2').value = 'Ana';
                // fila 3 vacía
                ws.getCell('A4').value = 'Luis';
            });

            const parsed = await reader.read(buffer);
            // Solo las filas con datos (Ana, Luis); la vacía se descarta.
            expect(parsed['Hoja1']).toHaveLength(2);
            expect(parsed['Hoja1'][0]['nombre']).toBe('Ana');
            expect(parsed['Hoja1'][1]['nombre']).toBe('Luis');
            expect(parsed['Hoja1'][1].__rowNumber).toBe(4);
        });

        it('should read multiple sheets into the same workbook result', async () => {
            const buffer = await buildBuffer((wb) => {
                const a = wb.addWorksheet('A');
                a.getCell('A1').value = 'Col';
                a.getCell('A2').value = 'v1';
                const b = wb.addWorksheet('B');
                b.getCell('A1').value = 'Col';
                b.getCell('A2').value = 'v2';
            });

            const parsed = await reader.read(buffer);
            expect(parsed['A'][0]['col']).toBe('v1');
            expect(parsed['B'][0]['col']).toBe('v2');
        });
    });

    /**
     * ExceljsWorkbookBuilder
     * ----------
     * Responsable de:
     * - construir un libro .xlsx a partir de definiciones de hojas
     * - aplicar ancho por defecto cuando una columna no lo especifica
     * - resaltar en ámbar las filas que cumplen `highlightWhen`
     */
    // STATUS: Implementación completa (escritura de libros .xlsx).
    describe('ExceljsWorkbookBuilder', () => {
        const builder = new ExceljsWorkbookBuilder();

        it('should build a workbook buffer with default and custom widths', async () => {
            const buffer = await builder.build([
                {
                    name: 'Hoja1',
                    columns: [
                        { header: 'Nombre', key: 'nombre', width: 40 },
                        { header: 'Correo', key: 'correo' }, // sin width => 20
                    ],
                    rows: [{ nombre: 'Ana', correo: 'ana@x.com' }],
                },
            ]);

            expect(buffer.length).toBeGreaterThan(0);

            // Releemos el libro para verificar metadatos y anchos.
            const wb = new Workbook();
            await wb.xlsx.load(buffer as unknown as ArrayBuffer);
            const ws = wb.getWorksheet('Hoja1')!;
            expect(ws.getColumn(1).width).toBe(40);
            expect(ws.getColumn(2).width).toBe(20);
            expect(ws.getRow(1).font).toEqual({ bold: true });
            expect(wb.creator).toBe('Bioactiva CRM');
        });

        it('should highlight rows that match highlightWhen', async () => {
            const buffer = await builder.build([
                {
                    name: 'Hoja1',
                    columns: [{ header: 'Estado', key: 'estado' }],
                    rows: [{ estado: 'VIGENTE' }, { estado: 'DESACTIVADO' }],
                    highlightWhen: (row) => row.estado === 'DESACTIVADO',
                },
            ]);

            const wb = new Workbook();
            await wb.xlsx.load(buffer as unknown as ArrayBuffer);
            const ws = wb.getWorksheet('Hoja1')!;

            // Fila 2 = primer dato (VIGENTE) sin relleno; fila 3 = resaltada.
            const plainCell = ws.getRow(2).getCell(1);
            const highlightedCell = ws.getRow(3).getCell(1);
            expect((highlightedCell.fill as { type?: string })?.type).toBe(
                'pattern',
            );
            expect((highlightedCell.fill as any).fgColor.argb).toBe(
                'FFFFE08A',
            );
            // Sin relleno la celda no tiene fill de patrón.
            expect((plainCell.fill as { type?: string })?.type).not.toBe(
                'pattern',
            );
        });

        it('should not highlight any row when highlightWhen is undefined', async () => {
            const buffer = await builder.build([
                {
                    name: 'Hoja1',
                    columns: [{ header: 'Estado', key: 'estado' }],
                    rows: [{ estado: 'VIGENTE' }],
                },
            ]);

            const wb = new Workbook();
            await wb.xlsx.load(buffer as unknown as ArrayBuffer);
            const ws = wb.getWorksheet('Hoja1')!;
            expect((ws.getRow(2).getCell(1).fill as { type?: string })?.type).not.toBe(
                'pattern',
            );
        });
    });
});
