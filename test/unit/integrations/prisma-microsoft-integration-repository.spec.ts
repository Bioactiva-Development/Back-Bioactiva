import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaMicrosoftIntegrationRepository } from '@/modules/integrations/infrastructure/persistance/prisma-microsoft-integration.repository';
import { MicrosoftIntegration } from '@/modules/integrations/domain/entities/microsoft-integration';
import { EncryptionServicePort } from '@/shared/domain/ports/encryption-service.port';

describe('Integrations module', () => {
    describe('PrismaMicrosoftIntegrationRepository', () => {
        let repository: PrismaMicrosoftIntegrationRepository;
        let prisma: any;
        let encryption: jest.Mocked<EncryptionServicePort>;

        const baseDate = new Date('2024-01-01T00:00:00.000Z');
        const mockRecord = {
            id: 1,
            idUsuario: 5,
            microsoftEmail: 'user@example.com',
            microsoftOid: 'oid-123',
            refreshToken: 'iv:tag:refresh-token',
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

            encryption = {
                encrypt: jest.fn((plain: string) => `iv:tag:${plain}`),
                decrypt: jest.fn((ciphertext: string) =>
                    ciphertext.replace('iv:tag:', ''),
                ),
            };

            repository = new PrismaMicrosoftIntegrationRepository(
                prisma,
                encryption,
            );
        });

        it('should find integration by user id and decrypt the refresh token', async () => {
            prisma.integracionMicrosoft.findUnique.mockResolvedValue(
                mockRecord,
            );

            const result = await repository.findByUserId(5);

            expect(result).toBeInstanceOf(MicrosoftIntegration);
            expect(result?.idUsuario).toBe(5);
            expect(result?.microsoftEmail).toBe('user@example.com');
            expect(result?.conectado).toBe(true);
            expect(result?.refreshToken).toBe('refresh-token');
            expect(encryption.decrypt).toHaveBeenCalledWith(
                'iv:tag:refresh-token',
            );

            expect(prisma.integracionMicrosoft.findUnique).toHaveBeenCalledWith(
                {
                    where: { idUsuario: 5 },
                },
            );
        });

        it('should return a legacy plaintext refresh token as-is (pre-encryption rollout)', async () => {
            prisma.integracionMicrosoft.findUnique.mockResolvedValue({
                ...mockRecord,
                refreshToken: 'legacy-plaintext-token',
            });

            const result = await repository.findByUserId(5);

            expect(result?.refreshToken).toBe('legacy-plaintext-token');
            expect(encryption.decrypt).not.toHaveBeenCalled();
        });

        it('should return null when no integration found', async () => {
            prisma.integracionMicrosoft.findUnique.mockResolvedValue(null);

            const result = await repository.findByUserId(999);

            expect(result).toBeNull();
        });

        it('should create a new integration with an encrypted refresh token', async () => {
            prisma.integracionMicrosoft.create.mockResolvedValue({
                ...mockRecord,
                id: 2,
            });

            const integration = buildIntegration();
            const result = await repository.save(integration);

            expect(result).toBeInstanceOf(MicrosoftIntegration);
            expect(encryption.encrypt).toHaveBeenCalledWith('refresh-token');
            expect(prisma.integracionMicrosoft.create).toHaveBeenCalledWith({
                data: {
                    idUsuario: 5,
                    microsoftEmail: 'user@example.com',
                    microsoftOid: 'oid-123',
                    refreshToken: 'iv:tag:refresh-token',
                    tokenExpiresAt: expect.any(Date),
                    conectado: true,
                },
            });
        });

        it('should update an existing integration with an encrypted refresh token', async () => {
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
            expect(encryption.encrypt).toHaveBeenCalledWith('new-refresh');
            expect(prisma.integracionMicrosoft.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    microsoftEmail: 'updated@example.com',
                    microsoftOid: 'oid-456',
                    refreshToken: 'iv:tag:new-refresh',
                    tokenExpiresAt: expect.any(Date),
                    conectado: true,
                },
            });
        });

        it('should not call encrypt when saving a null refresh token (disconnect)', async () => {
            prisma.integracionMicrosoft.update.mockResolvedValue({
                ...mockRecord,
                refreshToken: null,
                conectado: false,
            });

            const integration = new MicrosoftIntegration(
                1,
                5,
                'user@example.com',
                'oid-123',
                null,
                null,
                false,
                baseDate,
                baseDate,
            );

            const result = await repository.save(integration);

            expect(encryption.encrypt).not.toHaveBeenCalled();
            expect(result.refreshToken).toBeNull();
            expect(prisma.integracionMicrosoft.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: expect.objectContaining({ refreshToken: null }),
            });
        });
    });
});
