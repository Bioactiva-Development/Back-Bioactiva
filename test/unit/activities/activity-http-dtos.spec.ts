import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListActivitiesQueryDto } from '@/modules/activities/infrastructure/http/dto/list-activities-query.dto.http';
import { HttpCreateActivityDto } from '@/modules/activities/infrastructure/http/dto/create-activity.dto.http';
import { HttpUpdateActivityDto } from '@/modules/activities/infrastructure/http/dto/update-activity.dto.http';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';

/**
 * HTTP DTOs de actividades
 * ------------------------
 * Ejercita las transformaciones (@Type Number/Date) y las validaciones
 * (@IsInt, @Min, @IsEnum, @IsDate, @Length...) con entradas válidas e inválidas
 * para cubrir cada rama de transformación y validación.
 */
describe('Activities module', () => {
    describe('ListActivitiesQueryDto', () => {
        it('should transform numeric strings and dates and pass validation', async () => {
            const dto = plainToInstance(ListActivitiesQueryDto, {
                idLead: '1',
                idResponsable: '5',
                estado: 'PENDIENTE',
                tipo: 'LLAMADA',
                fechaInicio: '2026-06-01T00:00:00.000Z',
                fechaFin: '2026-06-30T23:59:59.000Z',
                page: '2',
                limit: '20',
            });

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
            expect(dto.idLead).toBe(1);
            expect(dto.idResponsable).toBe(5);
            expect(dto.estado).toBe(EstadoActividad.PENDIENTE);
            expect(dto.tipo).toBe(TipoActividad.LLAMADA);
            expect(dto.fechaInicio).toBeInstanceOf(Date);
            expect(dto.fechaFin).toBeInstanceOf(Date);
            expect(dto.page).toBe(2);
            expect(dto.limit).toBe(20);
        });

        it('should default page and limit when omitted', async () => {
            const dto = plainToInstance(ListActivitiesQueryDto, {});

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
            expect(dto.page).toBe(1);
            expect(dto.limit).toBe(10);
        });

        it('should reject invalid values across every field', async () => {
            const dto = plainToInstance(ListActivitiesQueryDto, {
                idLead: '0',
                idResponsable: 'abc',
                estado: 'NOPE',
                tipo: 'NOPE',
                fechaInicio: 'not-a-date',
                fechaFin: 'not-a-date',
                page: '0',
                limit: '0',
            });

            const errors = await validate(dto);
            const failed = errors.map((e) => e.property).sort();

            expect(failed).toEqual(
                [
                    'estado',
                    'fechaFin',
                    'fechaInicio',
                    'idLead',
                    'idResponsable',
                    'limit',
                    'page',
                    'tipo',
                ].sort(),
            );
        });
    });

    describe('HttpCreateActivityDto', () => {
        const validPayload = {
            idLead: '1',
            nombreActividad: 'Llamada de seguimiento',
            fechaInicio: '2026-06-01T10:00:00.000Z',
            fechaFin: '2026-06-01T11:00:00.000Z',
            tipo: TipoActividad.LLAMADA,
        };

        it('should transform and validate a valid payload (notas/idResponsable optional)', async () => {
            const dto = plainToInstance(HttpCreateActivityDto, {
                ...validPayload,
                notas: 'Confirmar detalles',
                idResponsable: '3',
            });

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
            expect(dto.idLead).toBe(1);
            expect(dto.fechaInicio).toBeInstanceOf(Date);
            expect(dto.fechaFin).toBeInstanceOf(Date);
            expect(dto.idResponsable).toBe(3);
        });

        it('should validate without the optional fields', async () => {
            const dto = plainToInstance(HttpCreateActivityDto, validPayload);

            expect(await validate(dto)).toHaveLength(0);
        });

        it('should reject invalid required and optional fields', async () => {
            const dto = plainToInstance(HttpCreateActivityDto, {
                idLead: '0',
                nombreActividad: '',
                fechaInicio: 'bad',
                fechaFin: 'bad',
                tipo: 'NOPE',
                notas: '',
                idResponsable: '0',
            });

            const errors = await validate(dto);
            const failed = errors.map((e) => e.property).sort();

            expect(failed).toEqual(
                [
                    'fechaFin',
                    'fechaInicio',
                    'idLead',
                    'idResponsable',
                    'nombreActividad',
                    'notas',
                    'tipo',
                ].sort(),
            );
        });
    });

    describe('HttpUpdateActivityDto', () => {
        it('should transform and validate provided optional fields', async () => {
            const dto = plainToInstance(HttpUpdateActivityDto, {
                nombreActividad: 'Nuevo nombre',
                fechaInicio: '2026-06-01T10:00:00.000Z',
                fechaFin: '2026-06-01T11:00:00.000Z',
                notas: 'Notas',
                idResponsable: '2',
            });

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
            expect(dto.fechaInicio).toBeInstanceOf(Date);
            expect(dto.fechaFin).toBeInstanceOf(Date);
            expect(dto.idResponsable).toBe(2);
        });

        it('should validate an empty payload (all optional)', async () => {
            const dto = plainToInstance(HttpUpdateActivityDto, {});

            expect(await validate(dto)).toHaveLength(0);
        });

        it('should accept Date instances directly', async () => {
            const dto = plainToInstance(HttpUpdateActivityDto, {
                fechaInicio: new Date('2026-06-01T10:00:00.000Z'),
                fechaFin: new Date('2026-06-01T11:00:00.000Z'),
            });

            expect(await validate(dto)).toHaveLength(0);
            expect(dto.fechaInicio).toBeInstanceOf(Date);
            expect(dto.fechaFin).toBeInstanceOf(Date);
        });

        it('should reject invalid optional fields', async () => {
            const dto = plainToInstance(HttpUpdateActivityDto, {
                nombreActividad: '',
                fechaInicio: 'bad',
                fechaFin: 'bad',
                notas: '',
                idResponsable: '0',
            });

            const errors = await validate(dto);
            const failed = errors.map((e) => e.property).sort();

            expect(failed).toEqual(
                [
                    'fechaFin',
                    'fechaInicio',
                    'idResponsable',
                    'nombreActividad',
                    'notas',
                ].sort(),
            );
        });
    });
});
