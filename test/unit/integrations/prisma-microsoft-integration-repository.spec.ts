import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaMicrosoftIntegrationRepository } from '@/modules/integrations/infrastructure/persistance/prisma-microsoft-integration.repository';
import { MicrosoftIntegration } from '@/modules/integrations/domain/entities/microsoft-integration';

describe('Integrations module', () => {
    describe('PrismaMicrosoftIntegrationRepository', () => {
        let repository: PrismaMicrosoftIntegrationRepository;
        let prisma: any;

        const baseDate = new Date('2024-01-01T00:00:00.000Z');
        const mockRecord = {
            id: 1,
            idUsuario: 5,
            microsoftEmail: 'user@example.com',
            microsoftOid: 'oid-123',
            refreshToken: 'refresh-token',
            tokenExpiresAt: new Date('2025-01-01T00:00:00.000Z'),
            conectado: true,
            createdAt: baseDate,
            updatedAt: baseDate,
        };

        const buildIntegration = () =>
            new MicrosoftIntegration(
                null,
                5,
                'user@example.com',
                'oid-123',
                'refresh-token',
                new Date('2025-01-01T00:00:00.000Z'),
                true,
                baseDate,
                baseDate,
            );

        beforeEach(() => {
            prisma = {
                integracionMicrosoft: {
                    findUnique: jest.fn(),
                    create: jest.fn(),
                    update: jest.fn(),
                },
            };

            repository = new PrismaMicrosoftIntegrationRepository(prisma);
        });

        it('should find integration by user id', async () => {
            prisma.integracionMicrosoft.findUnique.mockResolvedValue(
                mockRecord,
            );

            const result = await repository.findByUserId(5);

            expect(result).toBeInstanceOf(MicrosoftIntegration);
            expect(result?.idUsuario).toBe(5);
            expect(result?.microsoftEmail).toBe('user@example.com');
            expect(result?.conectado).toBe(true);

            expect(prisma.integracionMicrosoft.findUnique).toHaveBeenCalledWith(
                {
                    where: { idUsuario: 5 },
                },
            );
        });

        it('should return null when no integration found', async () => {
            prisma.integracionMicrosoft.findUnique.mockResolvedValue(null);

            const result = await repository.findByUserId(999);

            expect(result).toBeNull();
        });

        it('should create a new integration', async () => {
            prisma.integracionMicrosoft.create.mockResolvedValue({
                ...mockRecord,
                id: 2,
            });

            const integration = buildIntegration();
            const result = await repository.save(integration);

            expect(result).toBeInstanceOf(MicrosoftIntegration);
            expect(prisma.integracionMicrosoft.create).toHaveBeenCalledWith({
                data: {
                    idUsuario: 5,
                    microsoftEmail: 'user@example.com',
                    microsoftOid: 'oid-123',
                    refreshToken: 'refresh-token',
                    tokenExpiresAt: expect.any(Date),
                    conectado: true,
                },
            });
        });

        it('should update an existing integration', async () => {
            prisma.integracionMicrosoft.update.mockResolvedValue(mockRecord);

            const integration = new MicrosoftIntegration(
                1,
                5,
                'updated@example.com',
                'oid-456',
                'new-refresh',
                new Date('2026-01-01T00:00:00.000Z'),
                true,
                baseDate,
                baseDate,
            );

            const result = await repository.save(integration);

            expect(result).toBeInstanceOf(MicrosoftIntegration);
            expect(prisma.integracionMicrosoft.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    microsoftEmail: 'updated@example.com',
                    microsoftOid: 'oid-456',
                    refreshToken: 'new-refresh',
                    tokenExpiresAt: expect.any(Date),
                    conectado: true,
                },
            });
        });
    });
});
