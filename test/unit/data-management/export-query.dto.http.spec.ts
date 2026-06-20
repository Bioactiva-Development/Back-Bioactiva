import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
    ExportOrganizacionesQueryDto,
    ExportContactosQueryDto,
    ExportLeadsQueryDto,
    ExportCotizacionesQueryDto,
    ExportAllQueryDto,
} from '@/modules/data-management/infrastructure/http/dtos/export-query.dto.http';

describe('Data management module', () => {
    describe('export-query DTOs', () => {
        describe('ExportOrganizacionesQueryDto includeDeleted transform', () => {
            it.each([
                ['true', true],
                ['1', true],
                [true, true],
                ['false', false],
                ['0', false],
                ['anything', false],
            ])(
                'transforms %p to %p',
                async (input, expected) => {
                    const dto = plainToInstance(ExportOrganizacionesQueryDto, {
                        includeDeleted: input,
                    });
                    expect(dto.includeDeleted).toBe(expected);
                    const errors = await validate(dto);
                    expect(errors).toHaveLength(0);
                },
            );

            it('leaves includeDeleted undefined when omitted (optional)', async () => {
                const dto = plainToInstance(
                    ExportOrganizacionesQueryDto,
                    {},
                );
                // toBool runs only when key is present in plain; absent -> undefined.
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });

            it('accepts all string filters', async () => {
                const dto = plainToInstance(ExportOrganizacionesQueryDto, {
                    nombre: 'Org',
                    ruc: '20',
                    sector: 'Agrícola',
                    tipo: 'Empresa nacional',
                    tamano: 'Grande',
                });
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
                expect(dto.nombre).toBe('Org');
            });

            it('rejects non-string filters', async () => {
                const dto = plainToInstance(ExportOrganizacionesQueryDto, {
                    nombre: 123 as unknown as string,
                });
                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                expect(errors[0].property).toBe('nombre');
            });
        });

        describe('ExportContactosQueryDto', () => {
            it('accepts valid filters', async () => {
                const dto = plainToInstance(ExportContactosQueryDto, {
                    nombre: 'Juan',
                    correo: 'j@x.com',
                    organizacion: 'Org',
                });
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });

            it('rejects a non-string correo', async () => {
                const dto = plainToInstance(ExportContactosQueryDto, {
                    correo: 5 as unknown as string,
                });
                const errors = await validate(dto);
                expect(errors[0].property).toBe('correo');
            });
        });

        describe('ExportLeadsQueryDto', () => {
            it('accepts valid filters', async () => {
                const dto = plainToInstance(ExportLeadsQueryDto, {
                    estado: 'Nuevo',
                    servicio: 'S',
                    organizacion: 'Org',
                });
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });

            it('rejects a non-string estado', async () => {
                const dto = plainToInstance(ExportLeadsQueryDto, {
                    estado: {} as unknown as string,
                });
                const errors = await validate(dto);
                expect(errors[0].property).toBe('estado');
            });
        });

        describe('ExportCotizacionesQueryDto', () => {
            it('accepts valid filters', async () => {
                const dto = plainToInstance(ExportCotizacionesQueryDto, {
                    cliente: 'C',
                    servicio: 'S',
                    estado: 'Aceptada',
                });
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });

            it('rejects a non-string servicio', async () => {
                const dto = plainToInstance(ExportCotizacionesQueryDto, {
                    servicio: 9 as unknown as string,
                });
                const errors = await validate(dto);
                expect(errors[0].property).toBe('servicio');
            });
        });

        describe('ExportAllQueryDto includeDeleted transform', () => {
            it.each([
                ['true', true],
                ['1', true],
                ['no', false],
            ])('transforms %p to %p', async (input, expected) => {
                const dto = plainToInstance(ExportAllQueryDto, {
                    includeDeleted: input,
                });
                expect(dto.includeDeleted).toBe(expected);
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });

            it('is valid when omitted', async () => {
                const dto = plainToInstance(ExportAllQueryDto, {});
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });
        });
    });
});
