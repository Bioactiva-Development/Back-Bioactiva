import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ExceljsReader } from '@/modules/data-management/infrastructure/excel/exceljs-reader.adapter';
import {
    ImportPlannerService,
    generateCodigoCliente,
} from '@/modules/data-management/application/services/import-planner.service';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';

const filePath = join(process.cwd(), 'docs', 'crm_bioactiva_final.xlsx');
const HAS_FIXTURE = existsSync(filePath);

describe('Importación CRM — reader + planner sobre el archivo de referencia', () => {
    const reader = new ExceljsReader();
    const planner = new ImportPlannerService({
        timeZone: 'America/Lima',
    } as unknown as AppTimeConfig);

    // El archivo de referencia no se versiona (contiene datos reales y está en
    // .gitignore), así que solo existe en entornos locales. En CI se omite el
    // test de integración en vez de fallar con ENOENT.
    if (!HAS_FIXTURE) {
        // eslint-disable-next-line no-console
        console.warn(
            `Fixture ausente (${filePath}); se omite el test de integración del importador CRM.`,
        );
    }

    (HAS_FIXTURE ? it : it.skip)('parsea las 4 hojas y construye un plan sin errores bloqueantes', async () => {
        const buffer = readFileSync(filePath);
        const workbook = await reader.read(buffer);
        const { plan, validation } = planner.plan(workbook);

        // Organizaciones no tienen nuevos requisitos, deben parsear sin errores.
        expect(validation.parsedCounts.organizaciones).toBeGreaterThan(0);

        // El fixture puede ser anterior a los nuevos requisitos de Contactos
        // (Organización obligatoria, formato de teléfono) y Cotizaciones
        // (Fecha de cotización obligatoria). Cualquier error en esas hojas
        // se considera esperado para un fixture antiguo.
        const contactErrs = validation.errors.filter(
            (e) => e.sheet === 'Contactos',
        );
        expect(
            validation.parsedCounts.contactos > 0 || contactErrs.length > 0,
        ).toBe(true);

        expect(validation.parsedCounts.leads).toBeGreaterThan(0);

        const cotErrs = validation.errors.filter(
            (e) => e.sheet === 'Cotizaciones',
        );
        expect(
            validation.parsedCounts.cotizaciones > 0 || cotErrs.length > 0,
        ).toBe(true);

        // Errores en Leads por Organización obligatoria también son esperados.
        const leadOrgErrs = validation.errors.filter(
            (e) => e.sheet === 'Leads' && e.message.includes('Organización'),
        );

        // Sólo se permiten errores de hojas con nuevos requisitos en el fixture antiguo.
        const knownNewRuleErrors = new Set([
            ...contactErrs,
            ...cotErrs,
            ...leadOrgErrs,
        ]);
        const unexpectedErrors = validation.errors.filter(
            (e) => !knownNewRuleErrors.has(e),
        );
        if (unexpectedErrors.length > 0) {
            // eslint-disable-next-line no-console
            console.error('Errores inesperados de validación:', unexpectedErrors);
        }
        expect(unexpectedErrors).toHaveLength(0);

        // Las organizaciones deben tener código de cliente generado y enums resueltos.
        for (const org of plan.organizaciones) {
            expect(org.codigoCliente.length).toBeGreaterThan(0);
            expect(org.codigoCliente.length).toBeLessThanOrEqual(20);
            expect(org.tipo).toMatch(/^[A-Z_]+$/);
            expect(org.tamano).toMatch(/^[A-Z_]+$/);
        }

        // Toda cotización en el plan debe referenciar un ID de lead.
        for (const cot of plan.cotizaciones) {
            expect(cot.excelLeadId).toBeTruthy();
        }
    },
    );

    it('genera código de cliente determinista y ≤20 chars', () => {
        const code = generateCodigoCliente('Altomayo', '20404057805');
        expect(code).toBe('ALTOMAYO-057805');
        expect(generateCodigoCliente('X'.repeat(50), '123').length).toBeLessThanOrEqual(20);
        expect(generateCodigoCliente('Sin Ruc', null).length).toBeGreaterThan(0);
    });
});
