import { describe, expect, it } from '@jest/globals';
import { ActivityMapper } from '@/modules/activities/infrastructure/mappers/activity.mapper';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import {
    EstadoActividad as PrismaEstadoActividad,
    TipoActividad as PrismaTipoActividad,
} from '@prisma/client';

/**
 * ActivityMapper
 * --------------
 * Cubre todas las ramas de mapeo enum (estado y tipo) en ambas direcciones
 * (Prisma <-> dominio) que no ejercían los specs previos: REALIZADA, CANCELADA,
 * REUNION, EMAIL y OTRO.
 */
describe('Activities module', () => {
    describe('ActivityMapper', () => {
        describe('mapState', () => {
            it.each([
                ['PENDIENTE', EstadoActividad.PENDIENTE],
                ['REALIZADA', EstadoActividad.REALIZADA],
                ['CANCELADA', EstadoActividad.CANCELADA],
            ] as [PrismaEstadoActividad, EstadoActividad][])(
                'should map prisma state %s to domain',
                (prismaState, expected) => {
                    expect(ActivityMapper.mapState(prismaState)).toBe(expected);
                },
            );
        });

        describe('mapStateToPrisma', () => {
            it.each([
                [EstadoActividad.PENDIENTE, 'PENDIENTE'],
                [EstadoActividad.REALIZADA, 'REALIZADA'],
                [EstadoActividad.CANCELADA, 'CANCELADA'],
            ] as [EstadoActividad, PrismaEstadoActividad][])(
                'should map domain state %s to prisma',
                (domainState, expected) => {
                    expect(ActivityMapper.mapStateToPrisma(domainState)).toBe(
                        expected,
                    );
                },
            );
        });

        describe('mapType', () => {
            it.each([
                ['REUNION', TipoActividad.REUNION],
                ['LLAMADA', TipoActividad.LLAMADA],
                ['EMAIL', TipoActividad.EMAIL],
                ['OTRO', TipoActividad.OTRO],
            ] as [PrismaTipoActividad, TipoActividad][])(
                'should map prisma type %s to domain',
                (prismaType, expected) => {
                    expect(ActivityMapper.mapType(prismaType)).toBe(expected);
                },
            );
        });

        describe('mapTypeToPrisma', () => {
            it.each([
                [TipoActividad.REUNION, 'REUNION'],
                [TipoActividad.LLAMADA, 'LLAMADA'],
                [TipoActividad.EMAIL, 'EMAIL'],
                [TipoActividad.OTRO, 'OTRO'],
            ] as [TipoActividad, PrismaTipoActividad][])(
                'should map domain type %s to prisma',
                (domainType, expected) => {
                    expect(ActivityMapper.mapTypeToPrisma(domainType)).toBe(
                        expected,
                    );
                },
            );
        });

        describe('toDomain / toPersistence round-trip', () => {
            it('should map a REALIZADA / EMAIL record through both mappers', () => {
                const record = {
                    id: 5,
                    nombreActividad: 'Correo de cierre',
                    fechaInicio: new Date('2026-06-01T10:00:00.000Z'),
                    fechaFin: new Date('2026-06-01T11:00:00.000Z'),
                    tipo: 'EMAIL' as PrismaTipoActividad,
                    estado: 'REALIZADA' as PrismaEstadoActividad,
                    notas: 'Listo',
                    outlookEventId: 'evt-1',
                    outlookImported: true,
                    teamsMeetingUrl: 'https://teams',
                    seguimientoAutomatico: true,
                    idLead: 2,
                    idResponsable: 3,
                    createdAt: new Date('2026-05-01T00:00:00.000Z'),
                    updatedAt: new Date('2026-05-02T00:00:00.000Z'),
                    deletedAt: null,
                };

                const domain = ActivityMapper.toDomain(record);

                expect(domain).toBeInstanceOf(Actividad);
                expect(domain.estado).toBe(EstadoActividad.REALIZADA);
                expect(domain.tipo).toBe(TipoActividad.EMAIL);

                const persistence = ActivityMapper.toPersistence(domain);

                expect(persistence.estado).toBe('REALIZADA');
                expect(persistence.tipo).toBe('EMAIL');
                expect(persistence.lead).toEqual({ connect: { id: 2 } });
                expect(persistence.responsable).toEqual({ connect: { id: 3 } });
                expect(persistence.deletedAt).toBeNull();
            });
        });
    });
});
