import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GenerateTemplateUseCase } from '@/modules/data-management/application/use-cases/generate-template.use-case';
import { SheetDefinition } from '@/modules/data-management/domain/ports/workbook-builder.port';

describe('Data management module', () => {
    describe('GenerateTemplateUseCase', () => {
        let useCase: GenerateTemplateUseCase;
        let workbookBuilder: any;

        beforeEach(() => {
            workbookBuilder = { build: jest.fn() };
            useCase = new GenerateTemplateUseCase(workbookBuilder);
        });

        it('builds a workbook with the 4 empty sheets plus the reference sheet', async () => {
            const buffer = Buffer.from('template');
            workbookBuilder.build.mockResolvedValue(buffer);

            const result = await useCase.execute();

            expect(result).toBe(buffer);
            expect(workbookBuilder.build).toHaveBeenCalledTimes(1);

            const sheets: SheetDefinition[] =
                workbookBuilder.build.mock.calls[0][0];
            expect(sheets.map((s) => s.name)).toEqual([
                'Organizaciones',
                'Contactos',
                'Leads',
                'Cotizaciones',
                'Valores válidos',
            ]);

            // Las 4 hojas de datos están vacías con columnas key === header.
            for (const sheet of sheets.slice(0, 4)) {
                expect(sheet.rows).toEqual([]);
                for (const col of sheet.columns) {
                    expect(col.key).toBe(col.header);
                    expect(col.width).toBe(22);
                }
            }
        });

        it('builds a reference sheet listing all enum labels', async () => {
            workbookBuilder.build.mockResolvedValue(Buffer.from(''));

            await useCase.execute();

            const sheets: SheetDefinition[] =
                workbookBuilder.build.mock.calls[0][0];
            const ref = sheets[4];
            expect(ref.name).toBe('Valores válidos');
            expect(ref.columns).toEqual([
                { header: 'Campo', key: 'campo', width: 26 },
                { header: 'Valores aceptados', key: 'valores', width: 90 },
            ]);
            const campos = ref.rows.map((r) => r.campo);
            expect(campos).toEqual([
                'Tipo de organización',
                'Tamaño',
                'Sector',
                'Vocativo',
                'Estado de lead',
                'Moneda',
                'Estado de cotización',
            ]);
            const tipoRow = ref.rows.find(
                (r) => r.campo === 'Tipo de organización',
            );
            expect(String(tipoRow?.valores)).toContain('Academia');
        });
    });
});
