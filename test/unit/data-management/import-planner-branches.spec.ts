import { describe, expect, it } from '@jest/globals';
import { ImportPlannerService } from '@/modules/data-management/application/services/import-planner.service';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';
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
        const planner = new ImportPlannerService({
            timeZone: 'America/Lima',
        } as unknown as AppTimeConfig);

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
                // Sin filas útiles el archivo queda vacío → error de nivel general.
                expect(errorsFor('Organizaciones', validation)).toHaveLength(0);
                expect(validation.errors).toHaveLength(1);
                expect(validation.errors[0].message).toMatch(/no contiene registros/);
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

            it('plan válido con ruc nulo y sector presente', () => {
                const { plan, validation } = planner.plan(
                    wb({
                        organizaciones: [
                            {
                                __rowNumber: 2,
                                organizacion: 'Org',
                                'nombre completo': 'Org Completa',
                                'tipo de organizacion': 'empresa nacional',
                                tamano: 'grande',
                                sector: 'tecnologia',
                                // sin ruc
                            },
                        ],
                    }),
                );
                expect(validation.valid).toBe(true);
                expect(plan.organizaciones[0].sector).toBe('TECNOLOGIA');
                expect(plan.organizaciones[0].ruc).toBeNull();
            });
        });

        describe('Contactos', () => {
            it('omite filas residuales y reporta falta de Nombre, Correo, vocativo inválido y organización', () => {
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
                            {
                                __rowNumber: 6,
                                nombre: 'Juan',
                                'correo electronico 1': 'b@x.com',
                                // falta organizacion abreviado
                            },
                        ],
                    }),
                );
                expect(plan.contactos).toHaveLength(0);
                const errs = errorsFor('Contactos', validation);
                expect(errs).toHaveLength(4);
                expect(errs[0].message).toContain('Nombre');
                expect(errs[1].message).toContain('Correo electrónico 1');
                expect(errs[2].message).toContain('Vocativo');
                expect(errs[3].message).toContain('Organización');
            });

            it('plan válido de contacto con vocativo reconocido y organización', () => {
                const { plan, validation } = planner.plan(
                    wb({
                        contactos: [
                            {
                                __rowNumber: 2,
                                nombre: 'Juan',
                                'correo electronico 1': 'a@x.com',
                                vocativo: 'sr',
                                organizacion: 'OrgTest',
                            },
                        ],
                    }),
                );
                expect(validation.valid).toBe(true);
                expect(plan.contactos[0].vocativo).toBe('SR');
                expect(plan.contactos[0].orgNombreComercial).toBe('OrgTest');
                expect(plan.contactos[0].orgRuc).toBeNull();
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

            it('genera aviso sin encargado (actividad siempre null)', () => {
                const { plan, validation } = planner.plan(
                    wb({
                        leads: [
                            {
                                __rowNumber: 2,
                                'servicio de interes': 'S',
                                estado: 'nuevo',
                                organizacion: 'OrgTest',
                                // sin encargado -> warning
                            },
                        ],
                    }),
                );
                expect(validation.valid).toBe(true);
                expect(validation.warnings).toHaveLength(1);
                expect(validation.warnings[0].message).toContain('Encargado');
                expect(plan.leads[0].estado).toBe('EN_PROSPECTO');
                expect(plan.leads[0].actividad).toBeNull();
            });

            it('lead con encargado y organización -> sin warning y actividad null', () => {
                const { plan, validation } = planner.plan(
                    wb({
                        leads: [
                            {
                                __rowNumber: 2,
                                'servicio de interes': 'S',
                                estado: 'nuevo',
                                organizacion: 'OrgTest',
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
            it('omite residual y reporta cada campo faltante / inválido (sin dirigido/remitente, fecha requerida)', () => {
                const { plan, validation } = planner.plan(
                    wb({
                        cotizaciones: [
                            { __rowNumber: 2 }, // residual
                            {
                                __rowNumber: 3,
                                'nombre del servicio': 'S',
                                monto: '100',
                                moneda: 'soles',
                                'estado del proceso': 'enviada',
                                'fecha de cotizacion': new Date('2024-01-01'),
                                // falta id de lead
                            },
                            {
                                __rowNumber: 4,
                                'id de lead': 'L1',
                                monto: '100',
                                moneda: 'soles',
                                'estado del proceso': 'enviada',
                                'fecha de cotizacion': new Date('2024-01-01'),
                                // falta nombre del servicio
                            },
                            {
                                __rowNumber: 5,
                                'id de lead': 'L1',
                                'nombre del servicio': 'S',
                                monto: 'abc', // monto inválido
                                moneda: 'soles',
                                'estado del proceso': 'enviada',
                                'fecha de cotizacion': new Date('2024-01-01'),
                            },
                            {
                                __rowNumber: 6,
                                'id de lead': 'L1',
                                'nombre del servicio': 'S',
                                monto: '1000',
                                moneda: 'rublos', // moneda no reconocida
                                'estado del proceso': 'enviada',
                                'fecha de cotizacion': new Date('2024-01-01'),
                            },
                            {
                                __rowNumber: 7,
                                'id de lead': 'L1',
                                'nombre del servicio': 'S',
                                monto: '1000',
                                moneda: 'usd',
                                'estado del proceso': 'fantasma', // estado no reconocido
                                'fecha de cotizacion': new Date('2024-01-01'),
                            },
                            {
                                __rowNumber: 8,
                                'id de lead': 'L1',
                                'nombre del servicio': 'S',
                                monto: '1000',
                                moneda: 'soles',
                                'estado del proceso': 'enviada',
                                // falta fecha de cotizacion
                            },
                        ],
                    }),
                );
                expect(plan.cotizaciones).toHaveLength(0);
                const errs = errorsFor('Cotizaciones', validation);
                expect(errs).toHaveLength(6);
                expect(errs[0].message).toContain('ID de lead');
                expect(errs[1].message).toContain('Nombre del servicio');
                expect(errs[2].message).toContain('Monto');
                expect(errs[3].message).toContain('Moneda');
                expect(errs[4].message).toContain('Estado de cotización');
                expect(errs[5].message).toContain('Fecha de cotización');
            });

            it('cotización válida normaliza monto con coma decimal', () => {
                const { plan, validation } = planner.plan(
                    wb({
                        cotizaciones: [
                            {
                                __rowNumber: 2,
                                'id de lead': 'L1',
                                'nombre del servicio': 'S',
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
                            sector: 'tecnologia',
                            ruc: 'sin-digitos', // digits() -> null
                        },
                    ],
                }),
            );
            expect(validation.valid).toBe(true);
            expect(plan.organizaciones[0].rowNumber).toBe(0);
            expect(plan.organizaciones[0].ruc).toBeNull();
        });

        it('libro vacío -> inválido con error de registros vacíos', () => {
            const { plan, validation } = planner.plan(wb({}));
            expect(validation.valid).toBe(false);
            expect(validation.errors).toHaveLength(1);
            expect(validation.errors[0].message).toMatch(/no contiene registros/);
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
