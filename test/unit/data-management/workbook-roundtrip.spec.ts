import { ExceljsWorkbookBuilder } from '@/modules/data-management/infrastructure/excel/exceljs-workbook.builder';
import { ExceljsReader } from '@/modules/data-management/infrastructure/excel/exceljs-reader.adapter';

describe('Excel export/import round-trip', () => {
    it('escribe un libro y lo vuelve a leer con los mismos datos', async () => {
        const builder = new ExceljsWorkbookBuilder();
        const reader = new ExceljsReader();

        const buffer = await builder.build([
            {
                name: 'Organizaciones',
                columns: [
                    { header: 'Organización', key: 'org' },
                    { header: 'RUC', key: 'ruc' },
                ],
                rows: [
                    { org: 'Altomayo', ruc: '20404057805' },
                    { org: 'CITAGRO', ruc: '20131545500' },
                ],
            },
        ]);

        expect(buffer.length).toBeGreaterThan(0);

        const parsed = await reader.read(buffer);
        const rows = parsed['Organizaciones'];
        expect(rows).toHaveLength(2);
        expect(rows[0]['organizacion']).toBe('Altomayo');
        expect(String(rows[1]['ruc'])).toBe('20131545500');
    });
});
