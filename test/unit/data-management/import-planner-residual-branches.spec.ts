import { describe, expect, it } from '@jest/globals';
import {
    ImportPlannerService,
    generateCodigoCliente,
} from '@/modules/data-management/application/services/import-planner.service';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';
import {
    ParsedRow,
    ParsedWorkbook,
} from '@/modules/data-management/domain/ports/excel-reader.port';

/**
 * Cubre ramas residuales del planner no ejercitadas por los specs existentes:
 * celdas en blanco que str() colapsa a null, dateVal con string válido/ vacío,
 * los `?? ''` de los mensajes de error cuando el valor crudo es null, y la rama
 * `montoRaw ? ... : null` cuando no hay monto. No edita specs existentes.
 */
describe('Data management module', () => {
    describe('ImportPlannerService — ramas residuales', () => {
        const planner = new ImportPlannerService({
            timeZone: 'America/Lima',
        } as unknown as AppTimeConfig);
        const wb = (sheets: Record<string, ParsedRow[]>): ParsedWorkbook =>
            sheets;
        const errorsFor = (sheet: string, validation: { errors: any[] }) =>
            validation.errors.filter((e) => e.sheet === sheet);

        it('str() colapsa celdas solo-espacios a null (fila residual omitida)', () => {
            const { plan, validation } = planner.plan(
                wb({
                    organizaciones: [
                        {
                            __rowNumber: 2,
                            organizacion: '   ',
                            'nombre completo': '   ',
                            ruc: '   ',
                        },
                    ],
                }),
            );
            // Las tres celdas en blanco -> null, por lo que la fila se omite.
            expect(plan.organizaciones).toHaveLength(0);
            expect(validation.errors).toHaveLength(0);
        });

        it('mensajes de error usan "" cuando el valor crudo es null (tipo/tamaño)', () => {
            const { validation } = planner.plan(
                wb({
                    organizaciones: [
                        {
                            __rowNumber: 2,
                            organizacion: 'Org',
                            'nombre completo': 'Org Completa',
                            // sin tipo de organizacion -> tipoRaw null -> `?? ''`
                        },
                        {
                            __rowNumber: 3,
                            organizacion: 'Org',
                            'nombre completo': 'Org Completa',
                            'tipo de organizacion': 'empresa nacional',
                            // sin tamano -> tamanoRaw null -> `?? ''`
                        },
                    ],
                }),
            );
            const errs = errorsFor('Organizaciones', validation);
            expect(errs).toHaveLength(2);
            expect(errs[0].message).toContain('Tipo de organización');
            expect(errs[0].message).toContain('""');
            expect(errs[1].message).toContain('Tamaño');
            expect(errs[1].message).toContain('""');
        });

        it('lead con estado null reporta mensaje con "" y dateVal parsea string válido', () => {
            const { plan, validation } = planner.plan(
                wb({
                    leads: [
                        {
                            __rowNumber: 2,
                            'servicio de interes': 'S',
                            // estado null -> mensaje con `?? ''`
                        },
                        {
                            __rowNumber: 3,
                            'servicio de interes': 'S',
                            estado: 'nuevo',
                            encargado: 'Maria',
                            // string de fecha válido -> dateVal devuelve Date
                            'fecha de creacion': '2024-01-01T00:00:00.000Z',
                        },
                    ],
                }),
            );
            const errs = errorsFor('Leads', validation);
            expect(errs).toHaveLength(1);
            expect(errs[0].message).toContain('Estado de lead');
            expect(errs[0].message).toContain('""');
            expect(plan.leads[0].createdAt).toBeInstanceOf(Date);
        });

        it('cotización sin monto: rama montoRaw falsy -> null y mensaje con ""', () => {
            const { validation } = planner.plan(
                wb({
                    cotizaciones: [
                        {
                            __rowNumber: 2,
                            'id de lead': 'L1',
                            'dirigido a': 'Z',
                            'nombre del servicio': 'S',
                            remitente: 'R',
                            // sin monto -> montoRaw null -> monto null -> error con ""
                        },
                    ],
                }),
            );
            const errs = errorsFor('Cotizaciones', validation);
            expect(errs).toHaveLength(1);
            expect(errs[0].message).toContain('Monto');
            expect(errs[0].message).toContain('""');
        });

        it('cotización con moneda y estado null reportan mensaje con ""', () => {
            const { validation } = planner.plan(
                wb({
                    cotizaciones: [
                        {
                            __rowNumber: 2,
                            'id de lead': 'L1',
                            'dirigido a': 'Z',
                            'nombre del servicio': 'S',
                            remitente: 'R',
                            monto: '1000',
                            // moneda null -> mensaje con `?? ''`
                        },
                        {
                            __rowNumber: 3,
                            'id de lead': 'L1',
                            'dirigido a': 'Z',
                            'nombre del servicio': 'S',
                            remitente: 'R',
                            monto: '1000',
                            moneda: 'usd',
                            // estado del proceso null -> mensaje con `?? ''`
                        },
                    ],
                }),
            );
            const errs = errorsFor('Cotizaciones', validation);
            expect(errs).toHaveLength(2);
            expect(errs[0].message).toContain('Moneda');
            expect(errs[0].message).toContain('""');
            expect(errs[1].message).toContain('Estado de cotización');
            expect(errs[1].message).toContain('""');
        });

        it('dateVal devuelve null para celda de fecha vacía', () => {
            const { plan, validation } = planner.plan(
                wb({
                    leads: [
                        {
                            __rowNumber: 2,
                            'servicio de interes': 'S',
                            estado: 'nuevo',
                            encargado: 'Maria',
                            'fecha de creacion': '', // empty -> dateVal null
                        },
                    ],
                }),
            );
            expect(validation.valid).toBe(true);
            expect(plan.leads[0].createdAt).toBeNull();
        });

        it('generateCodigoCliente usa "ORG" cuando el nombre no tiene alfanuméricos', () => {
            // slug vacío -> fallback `|| 'ORG'`; sin ruc -> sin tail.
            expect(generateCodigoCliente('---', null)).toBe('ORG');
            // con ruc -> añade los últimos 6 dígitos.
            expect(generateCodigoCliente('***', '20123456789')).toBe(
                'ORG-456789',
            );
        });

        it('contacto con vocativo null no agrega error (rama vocativoRaw falsy)', () => {
            const { plan, validation } = planner.plan(
                wb({
                    contactos: [
                        {
                            __rowNumber: 2,
                            nombre: 'Juan',
                            'correo electronico 1': 'a@x.com',
                            // sin vocativo -> rama if(vocativoRaw) falsy
                        },
                    ],
                }),
            );
            expect(validation.valid).toBe(true);
            expect(plan.contactos[0].vocativo).toBeNull();
        });
    });
});
