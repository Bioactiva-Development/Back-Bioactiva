import { describe, expect, it } from '@jest/globals';
import { ImportPlannerService } from '@/modules/data-management/application/services/import-planner.service';
import {
    ParsedRow,
    ParsedWorkbook,
} from '@/modules/data-management/domain/ports/excel-reader.port';

/**
 * Cubre las ramas de error/aviso del planner alimentándolo con libros sintéticos.
 * No edita ni solapa el spec de referencia existente (import-planner.spec.ts).
 */
describe('Data management module', () => {
    describe('ImportPlannerService — ramas de error y avisos', () => {
        const planner = new ImportPlannerService();

        const wb = (sheets: Record<string, ParsedRow[]>): ParsedWorkbook =>
            sheets;

        const errorsFor = (sheet: string, validation: { errors: any[] }) =>
            validation.errors.filter((e) => e.sheet === sheet);

        describe('Organizaciones', () => {
            it('omite filas residuales totalmente vacías', () => {
                const { plan, validation } = planner.plan(
                    wb({ organizaciones: [{ __rowNumber: 2 }] }),
                );
                expect(plan.organizaciones).toHaveLength(0);
                expect(validation.errors).toHaveLength(0);
            });

            it('reporta falta de Organización, Nombre completo, Tipo, Tamaño y Sector', () => {
                const { validation } = planner.plan(
                    wb({
                        organizaciones: [
                            { __rowNumber: 2, ruc: '20', nombre: 'X' }, // falta organizacion
                            {
                                __rowNumber: 3,
                                organizacion: 'Org', // falta nombre completo
                            },
                            {
                                __rowNumber: 4,
                                organizacion: 'Org',
                                'nombre completo': 'Org Completa',
                                'tipo de organizacion': 'zzz', // tipo no reconocido
                            },
                            {
                                __rowNumber: 5,
                                organizacion: 'Org',
                                'nombre completo': 'Org Completa',
                                'tipo de organizacion': 'empresa nacional',
                                tamano: 'gigante', // tamaño no reconocido
                            },
                            {
                                __rowNumber: 6,
                                organizacion: 'Org',
                                'nombre completo': 'Org Completa',
                                'tipo de organizacion': 'empresa nacional',
                                tamano: 'grande',
                                sector: 'inexistente', // sector no reconocido
                            },
                        ],
                    }),
                );
                const errs = errorsFor('Organizaciones', validation);
                expect(errs).toHaveLength(5);
                expect(errs[0].message).toContain('Organización');
                expect(errs[1].message).toContain('Nombre completo');
                expect(errs[2].message).toContain('Tipo de organización');
                expect(errs[3].message).toContain('Tamaño');
                expect(errs[4].message).toContain('Sector');
                expect(validation.valid).toBe(false);
            });

            it('plan válido con sector vacío (sector queda null) y ruc nulo', () => {
                const { plan, validation } = planner.plan(
                    wb({
                        organizaciones: [
                            {
                                __rowNumber: 2,
                                organizacion: 'Org',
                                'nombre completo': 'Org Completa',
                                'tipo de organizacion': 'empresa nacional',
                                tamano: 'grande',
                                // sin sector ni ruc
                            },
                        ],
                    }),
                );
                expect(validation.valid).toBe(true);
                expect(plan.organizaciones[0].sector).toBeNull();
                expect(plan.organizaciones[0].ruc).toBeNull();
            });
        });

        describe('Contactos', () => {
            it('omite filas residuales y reporta falta de Nombre, Correo y vocativo inválido', () => {
                const { plan, validation } = planner.plan(
                    wb({
                        contactos: [
                            { __rowNumber: 2 }, // residual -> omitida
                            {
                                __rowNumber: 3,
                                'correo electronico 1': 'a@x.com', // falta nombre
                            },
                            {
                                __rowNumber: 4,
                                nombre: 'Juan', // falta correo
                            },
                            {
                                __rowNumber: 5,
                                nombre: 'Juan',
                                'correo electronico 1': 'a@x.com',
                                vocativo: 'capitan', // vocativo no reconocido
                            },
                        ],
                    }),
                );
                expect(plan.contactos).toHaveLength(0);
                const errs = errorsFor('Contactos', validation);
                expect(errs).toHaveLength(3);
                expect(errs[0].message).toContain('Nombre');
                expect(errs[1].message).toContain('Correo electrónico 1');
                expect(errs[2].message).toContain('Vocativo');
            });

            it('plan válido de contacto con vocativo reconocido', () => {
                const { plan, validation } = planner.plan(
                    wb({
                        contactos: [
                            {
                                __rowNumber: 2,
                                nombre: 'Juan',
                                'correo electronico 1': 'a@x.com',
                                vocativo: 'sr',
                                ruc: '20-404',
                            },
                        ],
                    }),
                );
                expect(validation.valid).toBe(true);
                expect(plan.contactos[0].vocativo).toBe('SR');
                expect(plan.contactos[0].orgRuc).toBe('20404');
            });
        });

        describe('Leads', () => {
            it('omite residual, reporta falta de servicio y estado no reconocido', () => {
                const { plan, validation } = planner.plan(
                    wb({
                        leads: [
                            { __rowNumber: 2 }, // residual
                            {
                                __rowNumber: 3,
                                'id lead': 'L1', // falta servicio de interes
                            },
                            {
                                __rowNumber: 4,
                                'servicio de interes': 'S',
                                estado: 'inventado', // estado no reconocido
                            },
                        ],
                    }),
                );
                expect(plan.leads).toHaveLength(0);
                const errs = errorsFor('Leads', validation);
                expect(errs).toHaveLength(2);
                expect(errs[0].message).toContain('Servicio de interés');
                expect(errs[1].message).toContain('Estado de lead');
            });

            it('genera aviso sin encargado y construye actividad próxima con fecha inválida -> null', () => {
                const { plan, validation } = planner.plan(
                    wb({
                        leads: [
                            {
                                __rowNumber: 2,
                                'servicio de interes': 'S',
                                estado: 'nuevo',
                                'proxima actividad': 'Reunión inicial',
                                'fecha de proxima actividad': 'no-es-fecha',
                                // sin encargado -> warning
                            },
                        ],
                    }),
                );
                expect(validation.valid).toBe(true);
                expect(validation.warnings).toHaveLength(1);
                expect(validation.warnings[0].message).toContain('Encargado');
                expect(plan.leads[0].estado).toBe('EN_PROSPECTO');
                expect(plan.leads[0].actividad).not.toBeNull();
                expect(plan.leads[0].actividad?.nombre).toBe(
                    'Reunión inicial',
                );
                expect(plan.leads[0].actividad?.fecha).toBeNull();
                expect(plan.leads[0].actividad?.tipo).toBe('OTRO');
            });

            it('lead con encargado y sin próxima actividad -> sin warning y actividad null', () => {
                const { plan, validation } = planner.plan(
                    wb({
                        leads: [
                            {
                                __rowNumber: 2,
                                'servicio de interes': 'S',
                                estado: 'nuevo',
                                encargado: 'Maria',
                                'fecha de creacion': new Date(
                                    '2024-01-01T00:00:00.000Z',
                                ),
                            },
                        ],
                    }),
                );
                expect(validation.warnings).toHaveLength(0);
                expect(plan.leads[0].actividad).toBeNull();
                expect(plan.leads[0].createdAt).toBeInstanceOf(Date);
            });
        });

        describe('Cotizaciones', () => {
            it('omite residual y reporta cada campo faltante / inválido', () => {
                const { plan, validation } = planner.plan(
                    wb({
                        cotizaciones: [
                            { __rowNumber: 2 }, // residual
                            {
                                __rowNumber: 3,
                                'dirigido a': 'Z', // falta id de lead
                            },
                            {
                                __rowNumber: 4,
                                'id de lead': 'L1', // falta dirigido a
                            },
                            {
                                __rowNumber: 5,
                                'id de lead': 'L1',
                                'dirigido a': 'Z', // falta nombre del servicio
                            },
                            {
                                __rowNumber: 6,
                                'id de lead': 'L1',
                                'dirigido a': 'Z',
                                'nombre del servicio': 'S', // falta remitente
                            },
                            {
                                __rowNumber: 7,
                                'id de lead': 'L1',
                                'dirigido a': 'Z',
                                'nombre del servicio': 'S',
                                remitente: 'R',
                                monto: 'abc', // monto inválido
                            },
                            {
                                __rowNumber: 8,
                                'id de lead': 'L1',
                                'dirigido a': 'Z',
                                'nombre del servicio': 'S',
                                remitente: 'R',
                                monto: '1000',
                                moneda: 'rublos', // moneda no reconocida
                            },
                            {
                                __rowNumber: 9,
                                'id de lead': 'L1',
                                'dirigido a': 'Z',
                                'nombre del servicio': 'S',
                                remitente: 'R',
                                monto: '1000',
                                moneda: 'usd',
                                'estado del proceso': 'fantasma', // estado no reconocido
                            },
                        ],
                    }),
                );
                expect(plan.cotizaciones).toHaveLength(0);
                const errs = errorsFor('Cotizaciones', validation);
                expect(errs).toHaveLength(7);
                expect(errs[0].message).toContain('ID de lead');
                expect(errs[1].message).toContain('Dirigido a');
                expect(errs[2].message).toContain('Nombre del servicio');
                expect(errs[3].message).toContain('Remitente');
                expect(errs[4].message).toContain('Monto');
                expect(errs[5].message).toContain('Moneda');
                expect(errs[6].message).toContain('Estado de cotización');
            });

            it('cotización válida normaliza monto con coma decimal', () => {
                const { plan, validation } = planner.plan(
                    wb({
                        cotizaciones: [
                            {
                                __rowNumber: 2,
                                'id de lead': 'L1',
                                'dirigido a': 'Z',
                                'nombre del servicio': 'S',
                                remitente: 'R',
                                monto: 'S/ 1250,50',
                                moneda: 'soles',
                                'estado del proceso': 'aceptada',
                                'fecha de cotizacion': new Date(
                                    '2024-05-01T00:00:00.000Z',
                                ),
                            },
                        ],
                    }),
                );
                expect(validation.valid).toBe(true);
                const cot = plan.cotizaciones[0];
                expect(cot.monto).toBe('1250.50');
                expect(cot.tipo).toBe('PEN');
                expect(cot.estado).toBe('ACEPTADA');
                expect(cot.fechaCot).toBeInstanceOf(Date);
            });
        });

        it('usa rowNumber 0 cuando __rowNumber no es numérico, y digits ignora valores no numéricos', () => {
            const { plan, validation } = planner.plan(
                wb({
                    organizaciones: [
                        {
                            // __rowNumber ausente / no numérico -> rowNum() devuelve 0
                            organizacion: 'Org',
                            'nombre completo': 'Org Completa',
                            'tipo de organizacion': 'empresa nacional',
                            tamano: 'grande',
                            ruc: 'sin-digitos', // digits() -> null
                        },
                    ],
                }),
            );
            expect(validation.valid).toBe(true);
            expect(plan.organizaciones[0].rowNumber).toBe(0);
            expect(plan.organizaciones[0].ruc).toBeNull();
        });

        it('libro vacío -> plan válido con conteos en cero', () => {
            const { plan, validation } = planner.plan(wb({}));
            expect(validation.valid).toBe(true);
            expect(plan.organizaciones).toHaveLength(0);
            expect(validation.parsedCounts).toEqual({
                organizaciones: 0,
                contactos: 0,
                leads: 0,
                cotizaciones: 0,
            });
        });
    });
});
