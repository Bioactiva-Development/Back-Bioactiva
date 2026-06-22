import { readFileSync } from 'fs';
import { join } from 'path';
import { ExceljsReader } from '@/modules/data-management/infrastructure/excel/exceljs-reader.adapter';
import {
    ImportPlannerService,
    generateCodigoCliente,
} from '@/modules/data-management/application/services/import-planner.service';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';

describe('Importación CRM — reader + planner sobre el archivo de referencia', () => {
    const reader = new ExceljsReader();
    const planner = new ImportPlannerService({
        timeZone: 'America/Lima',
    } as unknown as AppTimeConfig);
    const filePath = join(
        process.cwd(),
        'docs',
        'crm_bioactiva_final.xlsx',
    );

    it('parsea las 4 hojas y construye un plan sin errores bloqueantes', async () => {
        const buffer = readFileSync(filePath);
        const workbook = await reader.read(buffer);
        const { plan, validation } = planner.plan(workbook);

        // Debe reconocer las 4 hojas con datos.
        expect(validation.parsedCounts.organizaciones).toBeGreaterThan(0);
        expect(validation.parsedCounts.contactos).toBeGreaterThan(0);
        expect(validation.parsedCounts.leads).toBeGreaterThan(0);
        expect(validation.parsedCounts.cotizaciones).toBeGreaterThan(0);

        // El mapeo de sinónimos debe resolver todos los enums del archivo real.
        if (!validation.valid) {
            // Imprime los errores para diagnóstico si algo no mapea.
            // eslint-disable-next-line no-console
            console.error('Errores de validación:', validation.errors);
        }
        expect(validation.valid).toBe(true);

        // Las organizaciones deben tener código de cliente generado y enums resueltos.
        for (const org of plan.organizaciones) {
            expect(org.codigoCliente.length).toBeGreaterThan(0);
            expect(org.codigoCliente.length).toBeLessThanOrEqual(20);
            expect(org.tipo).toMatch(/^[A-Z_]+$/);
            expect(org.tamano).toMatch(/^[A-Z_]+$/);
        }

        // Toda cotización referencia un ID de lead.
        for (const cot of plan.cotizaciones) {
            expect(cot.excelLeadId).toBeTruthy();
        }
    });

    it('genera código de cliente determinista y ≤20 chars', () => {
        const code = generateCodigoCliente('Altomayo', '20404057805');
        expect(code).toBe('ALTOMAYO-057805');
        expect(generateCodigoCliente('X'.repeat(50), '123').length).toBeLessThanOrEqual(20);
        expect(generateCodigoCliente('Sin Ruc', null).length).toBeGreaterThan(0);
    });
});
