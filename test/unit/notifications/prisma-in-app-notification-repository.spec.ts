import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { PrismaInAppNotificationRepository } from '@/modules/notifications/infrastructure/persistance/prisma-in-app-notification.repository';
import { InAppNotification } from '@/modules/notifications/domain/entities/in-app-notification';
import { InAppNotificationStatus } from '@/modules/notifications/domain/enums/in-app-notification-status';

describe('Notifications module', () => {
    describe('PrismaInAppNotificationRepository', () => {
        let repository: PrismaInAppNotificationRepository;
        let mockPrisma: Partial<PrismaService>;

        const createdAt = new Date('2024-01-01T00:00:00Z');
        const mockRecord = {
            id: 1,
            titulo: 'Titulo',
            mensaje: 'Mensaje',
            estado: 'NO_LEIDA',
            idUsuario: 10,
            idActividad: null,
            idLead: 30,
            createdAt,
        };

        const buildNotification = (id: number | null) =>
            new InAppNotification(
                id,
                'Titulo',
                'Mensaje',
                InAppNotificationStatus.NO_LEIDA,
                10,
                null,
                30,
                createdAt,
            );

        beforeEach(() => {
            mockPrisma = {
                notificacion: {
                    create: jest.fn(),
                    createMany: jest.fn(),
                    update: jest.fn(),
                    findUnique: jest.fn(),
                    findMany: jest.fn(),
                },
            } as unknown as Partial<PrismaService>;

            repository = new PrismaInAppNotificationRepository(
                mockPrisma as any,
            );
        });

        describe('create', () => {
            it('should persist and return the mapped notification', async () => {
                (
                    mockPrisma.notificacion!.create as jest.Mock
                ).mockResolvedValue(mockRecord as never);

                const result = await repository.create(buildNotification(null));

                expect(mockPrisma.notificacion!.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({
                        titulo: 'Titulo',
                        idUsuario: 10,
                    }),
                });
                expect(result).toBeInstanceOf(InAppNotification);
                expect(result.id).toBe(1);
            });
        });

        describe('createMany', () => {
            it('should return 0 without touching Prisma when the array is empty', async () => {
                const result = await repository.createMany([]);

                expect(result).toBe(0);
                expect(
                    mockPrisma.notificacion!.createMany,
                ).not.toHaveBeenCalled();
            });

            it('should create all notifications and return the inserted count', async () => {
                (
                    mockPrisma.notificacion!.createMany as jest.Mock
                ).mockResolvedValue({ count: 2 } as never);

                const result = await repository.createMany([
                    buildNotification(null),
                    buildNotification(null),
                ]);

                expect(result).toBe(2);
                const arg = (mockPrisma.notificacion!.createMany as jest.Mock)
                    .mock.calls[0][0] as any;
                expect(arg.data).toHaveLength(2);
            });
        });

        describe('save', () => {
            it('should update the estado and return the mapped notification', async () => {
                (
                    mockPrisma.notificacion!.update as jest.Mock
                ).mockResolvedValue({ ...mockRecord, estado: 'LEIDA' } as never);

                const notification = buildNotification(1);
                notification.markAsRead();

                const result = await repository.save(notification);

                expect(mockPrisma.notificacion!.update).toHaveBeenCalledWith({
                    where: { id: 1 },
                    data: { estado: InAppNotificationStatus.LEIDA },
                });
                expect(result.estado).toBe(InAppNotificationStatus.LEIDA);
            });
        });

        describe('findById', () => {
            it('should return the mapped notification when found', async () => {
                (
                    mockPrisma.notificacion!.findUnique as jest.Mock
                ).mockResolvedValue(mockRecord as never);

                const result = await repository.findById(1);

                expect(mockPrisma.notificacion!.findUnique).toHaveBeenCalledWith(
                    { where: { id: 1 } },
                );
                expect(result).not.toBeNull();
                expect(result!.id).toBe(1);
            });

            it('should return null when not found', async () => {
                (
                    mockPrisma.notificacion!.findUnique as jest.Mock
                ).mockResolvedValue(null as never);

                const result = await repository.findById(999);

                expect(result).toBeNull();
            });
        });

        describe('listByUser', () => {
            it('should return notifications ordered by creation desc', async () => {
                (
                    mockPrisma.notificacion!.findMany as jest.Mock
                ).mockResolvedValue([mockRecord] as never);

                const result = await repository.listByUser(10);

                expect(mockPrisma.notificacion!.findMany).toHaveBeenCalledWith({
                    where: { idUsuario: 10 },
                    orderBy: { createdAt: 'desc' },
                });
                expect(result).toHaveLength(1);
                expect(result[0]).toBeInstanceOf(InAppNotification);
            });

            it('should return an empty array when the user has none', async () => {
                (
                    mockPrisma.notificacion!.findMany as jest.Mock
                ).mockResolvedValue([] as never);

                const result = await repository.listByUser(10);

                expect(result).toHaveLength(0);
            });
        });

        describe('findLeadIdsWithRecentAlert', () => {
            it('should return an empty array without querying when no lead ids', async () => {
                const result = await repository.findLeadIdsWithRecentAlert(
                    [],
                    7,
                );

                expect(result).toEqual([]);
                expect(
                    mockPrisma.notificacion!.findMany,
                ).not.toHaveBeenCalled();
            });

            it('should query distinct leads and filter out null idLead values', async () => {
                (
                    mockPrisma.notificacion!.findMany as jest.Mock
                ).mockResolvedValue([
                    { idLead: 1 },
                    { idLead: null },
                    { idLead: 3 },
                ] as never);

                const result = await repository.findLeadIdsWithRecentAlert(
                    [1, 2, 3],
                    7,
                );

                expect(result).toEqual([1, 3]);
                const arg = (mockPrisma.notificacion!.findMany as jest.Mock)
                    .mock.calls[0][0] as any;
                expect(arg.where.idLead).toEqual({ in: [1, 2, 3] });
                expect(arg.where.createdAt.gte).toBeInstanceOf(Date);
                expect(arg.distinct).toEqual(['idLead']);
                expect(arg.select).toEqual({ idLead: true });
            });
        });
    });
});
