import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { PrismaNotificationRepository } from '@/modules/notifications/infrastructure/persistance/prisma-notification.repository';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';
import { FollowUpInstance } from '@/modules/notifications/domain/entities/follow-up-instance';

describe('Notifications module', () => {
    describe('PrismaNotificationRepository', () => {
        let repository: PrismaNotificationRepository;
        let mockPrisma: Partial<PrismaService>;

        const createdAt = new Date('2024-01-01T00:00:00Z');
        const updatedAt = new Date('2024-01-02T00:00:00Z');
        const fecha = new Date('2024-01-03T00:00:00Z');

        const buildRecord = (overrides: Record<string, unknown> = {}) => ({
            id: 1,
            tipo: 'RECORDATORIO',
            estado: 'PROGRAMADA',
            idActividad: 100,
            idLead: 200,
            idResponsable: 300,
            asuntoInterno: 'Asunto',
            cuerpoInterno: 'Cuerpo',
            fechaEnvioInterno: fecha,
            idTemplateInterno: null,
            jobIdInterno: null,
            enviadoInterno: false,
            correoCliente: null,
            instancias: [],
            createdAt,
            updatedAt,
            ...overrides,
        });

        const buildInstance = (id: number | null) =>
            new FollowUpInstance(
                id,
                1,
                'AI',
                'CI',
                fecha,
                null,
                null,
                false,
                'AE',
                'CE',
                fecha,
                null,
                null,
                false,
            );

        const buildNotification = (
            id: number | null,
            instancias: FollowUpInstance[] = [],
        ) =>
            new ScheduledNotification(
                id,
                NotificationType.SEGUIMIENTO,
                NotificationStatus.PROGRAMADA,
                100,
                200,
                300,
                null,
                null,
                null,
                null,
                null,
                false,
                'cliente@test.com',
                instancias,
                createdAt,
                updatedAt,
            );

        beforeEach(() => {
            mockPrisma = {
                notificacionProgramada: {
                    create: jest.fn(),
                    update: jest.fn(),
                    findUnique: jest.fn(),
                    findFirst: jest.fn(),
                    findMany: jest.fn(),
                    findUniqueOrThrow: jest.fn(),
                    count: jest.fn(),
                },
                seguimientoInstancia: {
                    create: jest.fn(),
                    update: jest.fn(),
                    findUnique: jest.fn(),
                },
                $transaction: jest.fn(),
            } as unknown as Partial<PrismaService>;

            repository = new PrismaNotificationRepository(mockPrisma as any);
        });

        describe('save (create path)', () => {
            it('should create a new notification when id is null', async () => {
                (
                    mockPrisma.notificacionProgramada!.create as jest.Mock
                ).mockResolvedValue(
                    buildRecord({ tipo: 'SEGUIMIENTO' }) as never,
                );

                const result = await repository.save(buildNotification(null));

                expect(
                    mockPrisma.notificacionProgramada!.create,
                ).toHaveBeenCalledWith({
                    data: expect.any(Object),
                    include: { instancias: { orderBy: { orden: 'asc' } } },
                });
                expect(result).toBeInstanceOf(ScheduledNotification);
                expect(result.id).toBe(1);
            });
        });

        describe('save (update path)', () => {
            it('should run a transaction creating new instances and updating existing ones', async () => {
                (mockPrisma.$transaction as jest.Mock).mockResolvedValue(
                    [] as never,
                );
                (
                    mockPrisma.notificacionProgramada!
                        .findUniqueOrThrow as jest.Mock
                ).mockResolvedValue(
                    buildRecord({ id: 5, tipo: 'SEGUIMIENTO' }) as never,
                );
                // The transaction is given pre-built prisma operations; stub them
                // so the mapped calls inside the array don't blow up.
                (
                    mockPrisma.notificacionProgramada!.update as jest.Mock
                ).mockReturnValue({ op: 'update-notif' } as never);
                (
                    mockPrisma.seguimientoInstancia!.create as jest.Mock
                ).mockReturnValue({ op: 'create-inst' } as never);
                (
                    mockPrisma.seguimientoInstancia!.update as jest.Mock
                ).mockReturnValue({ op: 'update-inst' } as never);

                const notification = buildNotification(5, [
                    buildInstance(null), // new -> create
                    buildInstance(99), // existing -> update
                ]);

                const result = await repository.save(notification);

                expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
                const ops = (mockPrisma.$transaction as jest.Mock).mock
                    .calls[0][0] as unknown[];
                // 1 notif update + 2 instance operations.
                expect(ops).toHaveLength(3);
                expect(
                    mockPrisma.notificacionProgramada!.update,
                ).toHaveBeenCalledWith({
                    where: { id: 5 },
                    data: expect.any(Object),
                });
                expect(
                    mockPrisma.seguimientoInstancia!.create,
                ).toHaveBeenCalledWith({
                    data: expect.objectContaining({ idNotificacion: 5 }),
                });
                expect(
                    mockPrisma.seguimientoInstancia!.update,
                ).toHaveBeenCalledWith({
                    where: { id: 99 },
                    data: expect.any(Object),
                });
                expect(
                    mockPrisma.notificacionProgramada!.findUniqueOrThrow,
                ).toHaveBeenCalledWith({
                    where: { id: 5 },
                    include: { instancias: { orderBy: { orden: 'asc' } } },
                });
                expect(result.id).toBe(5);
            });
        });

        describe('findById', () => {
            it('should return the mapped notification when found', async () => {
                (
                    mockPrisma.notificacionProgramada!.findUnique as jest.Mock
                ).mockResolvedValue(buildRecord() as never);

                const result = await repository.findById(1);

                expect(
                    mockPrisma.notificacionProgramada!.findUnique,
                ).toHaveBeenCalledWith({
                    where: { id: 1 },
                    include: { instancias: { orderBy: { orden: 'asc' } } },
                });
                expect(result).not.toBeNull();
                expect(result!.id).toBe(1);
            });

            it('should return null when not found', async () => {
                (
                    mockPrisma.notificacionProgramada!.findUnique as jest.Mock
                ).mockResolvedValue(null as never);

                const result = await repository.findById(999);

                expect(result).toBeNull();
            });
        });

        describe('findActiveByActivity', () => {
            it('should return the mapped notification when an active one exists', async () => {
                (
                    mockPrisma.notificacionProgramada!.findFirst as jest.Mock
                ).mockResolvedValue(buildRecord() as never);

                const result = await repository.findActiveByActivity(100);

                expect(
                    mockPrisma.notificacionProgramada!.findFirst,
                ).toHaveBeenCalledWith({
                    where: {
                        idActividad: 100,
                        estado: NotificationStatus.PROGRAMADA,
                    },
                    include: { instancias: { orderBy: { orden: 'asc' } } },
                });
                expect(result!.id).toBe(1);
            });

            it('should return null when there is no active notification', async () => {
                (
                    mockPrisma.notificacionProgramada!.findFirst as jest.Mock
                ).mockResolvedValue(null as never);

                const result = await repository.findActiveByActivity(100);

                expect(result).toBeNull();
            });
        });

        describe('findByInstanceId', () => {
            it('should resolve the parent notification via the instance lookup', async () => {
                (
                    mockPrisma.seguimientoInstancia!.findUnique as jest.Mock
                ).mockResolvedValue({ idNotificacion: 1 } as never);
                (
                    mockPrisma.notificacionProgramada!.findUnique as jest.Mock
                ).mockResolvedValue(buildRecord() as never);

                const result = await repository.findByInstanceId(42);

                expect(
                    mockPrisma.seguimientoInstancia!.findUnique,
                ).toHaveBeenCalledWith({
                    where: { id: 42 },
                    select: { idNotificacion: true },
                });
                expect(result!.id).toBe(1);
            });

            it('should return null when the instance does not exist', async () => {
                (
                    mockPrisma.seguimientoInstancia!.findUnique as jest.Mock
                ).mockResolvedValue(null as never);

                const result = await repository.findByInstanceId(999);

                expect(result).toBeNull();
                expect(
                    mockPrisma.notificacionProgramada!.findUnique,
                ).not.toHaveBeenCalled();
            });
        });

        describe('list', () => {
            it('should default to PROGRAMADA/VENCIDA estados when no estado filter', async () => {
                (
                    mockPrisma.notificacionProgramada!.findMany as jest.Mock
                ).mockResolvedValue([buildRecord()] as never);

                const result = await repository.list({
                    idLead: 200,
                    idResponsable: 300,
                });

                const arg = (
                    mockPrisma.notificacionProgramada!.findMany as jest.Mock
                ).mock.calls[0][0] as any;
                expect(arg.where.estado).toEqual({
                    in: [
                        NotificationStatus.PROGRAMADA,
                        NotificationStatus.VENCIDA,
                    ],
                });
                expect(arg.where.idLead).toBe(200);
                expect(arg.where.idResponsable).toBe(300);
                expect(arg.orderBy).toEqual({ createdAt: 'desc' });
                // Sin page/limit explícitos cae en los valores por defecto.
                expect(arg.skip).toBe(0);
                expect(arg.take).toBe(10);
                expect(result).toHaveLength(1);
            });

            it('should use the provided estado filter when present', async () => {
                (
                    mockPrisma.notificacionProgramada!.findMany as jest.Mock
                ).mockResolvedValue([] as never);

                await repository.list({ estado: NotificationStatus.CANCELADA });

                const arg = (
                    mockPrisma.notificacionProgramada!.findMany as jest.Mock
                ).mock.calls[0][0] as any;
                expect(arg.where.estado).toBe(NotificationStatus.CANCELADA);
            });

            it('should apply skip/take from page and limit', async () => {
                (
                    mockPrisma.notificacionProgramada!.findMany as jest.Mock
                ).mockResolvedValue([] as never);

                await repository.list({ page: 3, limit: 5 });

                const arg = (
                    mockPrisma.notificacionProgramada!.findMany as jest.Mock
                ).mock.calls[0][0] as any;
                expect(arg.skip).toBe(10);
                expect(arg.take).toBe(5);
            });
        });

        describe('count', () => {
            it('should count with the same where clause and default estados', async () => {
                (
                    mockPrisma.notificacionProgramada!.count as jest.Mock
                ).mockResolvedValue(42 as never);

                const total = await repository.count({ idLead: 200 });

                const arg = (
                    mockPrisma.notificacionProgramada!.count as jest.Mock
                ).mock.calls[0][0] as any;
                expect(arg.where.estado).toEqual({
                    in: [
                        NotificationStatus.PROGRAMADA,
                        NotificationStatus.VENCIDA,
                    ],
                });
                expect(arg.where.idLead).toBe(200);
                expect(total).toBe(42);
            });
        });
    });
});
