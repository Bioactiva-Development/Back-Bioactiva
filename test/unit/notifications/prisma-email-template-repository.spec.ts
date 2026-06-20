import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { PrismaEmailTemplateRepository } from '@/modules/notifications/infrastructure/persistance/prisma-email-template.repository';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';

describe('Notifications module', () => {
    describe('PrismaEmailTemplateRepository', () => {
        let repository: PrismaEmailTemplateRepository;
        let mockPrisma: Partial<PrismaService>;

        const createdAt = new Date('2024-01-01T00:00:00Z');
        const updatedAt = new Date('2024-01-02T00:00:00Z');
        const mockRecord = {
            id: 1,
            nombre: 'Bienvenida',
            asunto: 'Hola',
            cuerpo: 'Cuerpo',
            activo: true,
            createdAt,
            updatedAt,
        };

        const buildTemplate = (id: number | null) =>
            new EmailTemplate(
                id,
                'Bienvenida',
                'Hola',
                'Cuerpo',
                true,
                createdAt,
                updatedAt,
            );

        beforeEach(() => {
            mockPrisma = {
                templateEmail: {
                    create: jest.fn(),
                    update: jest.fn(),
                    findUnique: jest.fn(),
                    findMany: jest.fn(),
                    delete: jest.fn(),
                },
                notificacionProgramada: {
                    count: jest.fn(),
                },
                seguimientoInstancia: {
                    count: jest.fn(),
                },
            } as unknown as Partial<PrismaService>;

            repository = new PrismaEmailTemplateRepository(mockPrisma as any);
        });

        describe('create', () => {
            it('should persist and return the mapped template', async () => {
                (
                    mockPrisma.templateEmail!.create as jest.Mock
                ).mockResolvedValue(mockRecord as never);

                const result = await repository.create(buildTemplate(null));

                expect(mockPrisma.templateEmail!.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({ nombre: 'Bienvenida' }),
                });
                expect(result).toBeInstanceOf(EmailTemplate);
                expect(result.id).toBe(1);
            });
        });

        describe('save', () => {
            it('should update by id and return the mapped template', async () => {
                (
                    mockPrisma.templateEmail!.update as jest.Mock
                ).mockResolvedValue(mockRecord as never);

                const result = await repository.save(buildTemplate(1));

                expect(mockPrisma.templateEmail!.update).toHaveBeenCalledWith({
                    where: { id: 1 },
                    data: expect.objectContaining({ nombre: 'Bienvenida' }),
                });
                expect(result.id).toBe(1);
            });
        });

        describe('findById', () => {
            it('should return the mapped template when found', async () => {
                (
                    mockPrisma.templateEmail!.findUnique as jest.Mock
                ).mockResolvedValue(mockRecord as never);

                const result = await repository.findById(1);

                expect(
                    mockPrisma.templateEmail!.findUnique,
                ).toHaveBeenCalledWith({ where: { id: 1 } });
                expect(result).not.toBeNull();
                expect(result!.nombre).toBe('Bienvenida');
            });

            it('should return null when not found', async () => {
                (
                    mockPrisma.templateEmail!.findUnique as jest.Mock
                ).mockResolvedValue(null as never);

                const result = await repository.findById(999);

                expect(result).toBeNull();
            });
        });

        describe('findByName', () => {
            it('should return the mapped template when found', async () => {
                (
                    mockPrisma.templateEmail!.findUnique as jest.Mock
                ).mockResolvedValue(mockRecord as never);

                const result = await repository.findByName('Bienvenida');

                expect(
                    mockPrisma.templateEmail!.findUnique,
                ).toHaveBeenCalledWith({ where: { nombre: 'Bienvenida' } });
                expect(result!.nombre).toBe('Bienvenida');
            });

            it('should return null when not found', async () => {
                (
                    mockPrisma.templateEmail!.findUnique as jest.Mock
                ).mockResolvedValue(null as never);

                const result = await repository.findByName('Inexistente');

                expect(result).toBeNull();
            });
        });

        describe('list', () => {
            it('should query only active templates when includeInactive is false', async () => {
                (
                    mockPrisma.templateEmail!.findMany as jest.Mock
                ).mockResolvedValue([mockRecord] as never);

                const result = await repository.list(false);

                expect(mockPrisma.templateEmail!.findMany).toHaveBeenCalledWith({
                    where: { activo: true },
                    orderBy: { nombre: 'asc' },
                });
                expect(result).toHaveLength(1);
                expect(result[0]).toBeInstanceOf(EmailTemplate);
            });

            it('should query all templates when includeInactive is true', async () => {
                (
                    mockPrisma.templateEmail!.findMany as jest.Mock
                ).mockResolvedValue([] as never);

                const result = await repository.list(true);

                expect(mockPrisma.templateEmail!.findMany).toHaveBeenCalledWith({
                    where: undefined,
                    orderBy: { nombre: 'asc' },
                });
                expect(result).toHaveLength(0);
            });
        });

        describe('delete', () => {
            it('should delete by id', async () => {
                (
                    mockPrisma.templateEmail!.delete as jest.Mock
                ).mockResolvedValue(mockRecord as never);

                await repository.delete(1);

                expect(mockPrisma.templateEmail!.delete).toHaveBeenCalledWith({
                    where: { id: 1 },
                });
            });
        });

        describe('isUsedByNotification', () => {
            it('should return true when a reminder references the template', async () => {
                (
                    mockPrisma.notificacionProgramada!.count as jest.Mock
                ).mockResolvedValue(1 as never);
                (
                    mockPrisma.seguimientoInstancia!.count as jest.Mock
                ).mockResolvedValue(0 as never);

                const result = await repository.isUsedByNotification(5);

                expect(result).toBe(true);
                expect(
                    mockPrisma.notificacionProgramada!.count,
                ).toHaveBeenCalledWith({ where: { idTemplateInterno: 5 } });
                expect(
                    mockPrisma.seguimientoInstancia!.count,
                ).toHaveBeenCalledWith({
                    where: {
                        OR: [
                            { idTemplateInterno: 5 },
                            { idTemplateExterno: 5 },
                        ],
                    },
                });
            });

            it('should return true when a follow-up instance references the template', async () => {
                (
                    mockPrisma.notificacionProgramada!.count as jest.Mock
                ).mockResolvedValue(0 as never);
                (
                    mockPrisma.seguimientoInstancia!.count as jest.Mock
                ).mockResolvedValue(2 as never);

                const result = await repository.isUsedByNotification(5);

                expect(result).toBe(true);
            });

            it('should return false when nothing references the template', async () => {
                (
                    mockPrisma.notificacionProgramada!.count as jest.Mock
                ).mockResolvedValue(0 as never);
                (
                    mockPrisma.seguimientoInstancia!.count as jest.Mock
                ).mockResolvedValue(0 as never);

                const result = await repository.isUsedByNotification(5);

                expect(result).toBe(false);
            });
        });
    });
});
