import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { PrismaEmailTemplateReader } from '@/modules/notifications/infrastructure/persistance/prisma-email-template-reader';

describe('Notifications module', () => {
    describe('PrismaEmailTemplateReader', () => {
        let reader: PrismaEmailTemplateReader;
        let mockPrisma: Partial<PrismaService>;

        const mockRecord = {
            id: 1,
            nombre: 'Bienvenida',
            asunto: 'Hola',
            cuerpo: 'Cuerpo',
            activo: true,
        };

        beforeEach(() => {
            mockPrisma = {
                templateEmail: {
                    findMany: jest.fn(),
                    findFirst: jest.fn(),
                },
            } as unknown as Partial<PrismaService>;

            reader = new PrismaEmailTemplateReader(mockPrisma as any);
        });

        describe('listActive', () => {
            it('should return the projected active templates', async () => {
                (
                    mockPrisma.templateEmail!.findMany as jest.Mock
                ).mockResolvedValue([mockRecord] as never);

                const result = await reader.listActive();

                expect(mockPrisma.templateEmail!.findMany).toHaveBeenCalledWith({
                    where: { activo: true },
                    orderBy: { nombre: 'asc' },
                });
                expect(result).toEqual([
                    {
                        id: 1,
                        nombre: 'Bienvenida',
                        asunto: 'Hola',
                        cuerpo: 'Cuerpo',
                        activo: true,
                    },
                ]);
            });

            it('should return an empty array when there are no active templates', async () => {
                (
                    mockPrisma.templateEmail!.findMany as jest.Mock
                ).mockResolvedValue([] as never);

                const result = await reader.listActive();

                expect(result).toEqual([]);
            });
        });

        describe('findActiveById', () => {
            it('should return the projected template when found', async () => {
                (
                    mockPrisma.templateEmail!.findFirst as jest.Mock
                ).mockResolvedValue(mockRecord as never);

                const result = await reader.findActiveById(1);

                expect(
                    mockPrisma.templateEmail!.findFirst,
                ).toHaveBeenCalledWith({ where: { id: 1, activo: true } });
                expect(result).toEqual({
                    id: 1,
                    nombre: 'Bienvenida',
                    asunto: 'Hola',
                    cuerpo: 'Cuerpo',
                    activo: true,
                });
            });

            it('should return null when no active template matches', async () => {
                (
                    mockPrisma.templateEmail!.findFirst as jest.Mock
                ).mockResolvedValue(null as never);

                const result = await reader.findActiveById(999);

                expect(result).toBeNull();
            });
        });
    });
});
