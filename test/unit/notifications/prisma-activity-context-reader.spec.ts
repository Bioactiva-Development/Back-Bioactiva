import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { PrismaActivityContextReader } from '@/modules/notifications/infrastructure/persistance/prisma-activity-context-reader';

describe('Notifications module', () => {
    describe('PrismaActivityContextReader', () => {
        let reader: PrismaActivityContextReader;
        let mockPrisma: Partial<PrismaService>;

        const fechaFin = new Date('2024-02-01T00:00:00Z');

        beforeEach(() => {
            mockPrisma = {
                actividad: {
                    findFirst: jest.fn(),
                },
                usuario: {
                    findUnique: jest.fn(),
                },
            } as unknown as Partial<PrismaService>;

            reader = new PrismaActivityContextReader(mockPrisma as any);
        });

        describe('getActiveActivityByLead', () => {
            it('should return null when there is no active activity', async () => {
                (
                    mockPrisma.actividad!.findFirst as jest.Mock
                ).mockResolvedValue(null as never);

                const result = await reader.getActiveActivityByLead(200);

                expect(mockPrisma.actividad!.findFirst).toHaveBeenCalledWith({
                    where: { idLead: 200, estado: 'PENDIENTE', deletedAt: null },
                    include: expect.any(Object),
                });
                expect(result).toBeNull();
            });

            it('should map the activity and collect both contact emails', async () => {
                (
                    mockPrisma.actividad!.findFirst as jest.Mock
                ).mockResolvedValue({
                    id: 100,
                    idLead: 200,
                    fechaFin,
                    estado: 'PENDIENTE',
                    lead: {
                        encargado: { id: 300, correo: 'responsable@test.com' },
                        contacto: {
                            correo: 'c1@test.com',
                            correo2: 'c2@test.com',
                        },
                    },
                } as never);

                const result = await reader.getActiveActivityByLead(200);

                expect(result).toEqual({
                    idActividad: 100,
                    idLead: 200,
                    idResponsable: 300,
                    responsableEmail: 'responsable@test.com',
                    fechaFin,
                    estado: 'PENDIENTE',
                    contactEmails: ['c1@test.com', 'c2@test.com'],
                });
            });

            it('should drop empty/null contact emails', async () => {
                (
                    mockPrisma.actividad!.findFirst as jest.Mock
                ).mockResolvedValue({
                    id: 101,
                    idLead: 201,
                    fechaFin,
                    estado: 'PENDIENTE',
                    lead: {
                        encargado: { id: 301, correo: 'r@test.com' },
                        contacto: { correo: null, correo2: '' },
                    },
                } as never);

                const result = await reader.getActiveActivityByLead(201);

                expect(result!.contactEmails).toEqual([]);
            });

            it('should handle a lead with no contacto (null)', async () => {
                (
                    mockPrisma.actividad!.findFirst as jest.Mock
                ).mockResolvedValue({
                    id: 102,
                    idLead: 202,
                    fechaFin,
                    estado: 'PENDIENTE',
                    lead: {
                        encargado: { id: 302, correo: 'r@test.com' },
                        contacto: null,
                    },
                } as never);

                const result = await reader.getActiveActivityByLead(202);

                expect(result!.contactEmails).toEqual([]);
            });
        });

        describe('getUserEmail', () => {
            it('should return the user email when found', async () => {
                (
                    mockPrisma.usuario!.findUnique as jest.Mock
                ).mockResolvedValue({ correo: 'user@test.com' } as never);

                const result = await reader.getUserEmail(300);

                expect(mockPrisma.usuario!.findUnique).toHaveBeenCalledWith({
                    where: { id: 300 },
                    select: { correo: true },
                });
                expect(result).toBe('user@test.com');
            });

            it('should return null when the user does not exist', async () => {
                (
                    mockPrisma.usuario!.findUnique as jest.Mock
                ).mockResolvedValue(null as never);

                const result = await reader.getUserEmail(999);

                expect(result).toBeNull();
            });
        });
    });
});
