import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { MicrosoftIntegration } from '@/modules/integrations/domain/entities/microsoft-integration';
import { MicrosoftIntegrationRepositoryPort } from '@/modules/integrations/domain/ports/microsoft-integration-repository.port';
import { MicrosoftIntegrationMapper } from '@/modules/integrations/infrastructure/persistance/mappers/microsoft-integration.mapper';
import { EncryptionServicePort } from '@/shared/domain/ports/encryption-service.port';

@Injectable()
export class PrismaMicrosoftIntegrationRepository implements MicrosoftIntegrationRepositoryPort {
    constructor(
        private readonly prisma: PrismaService,
        private readonly encryption: EncryptionServicePort,
    ) {}

    async findByUserId(userId: number): Promise<MicrosoftIntegration | null> {
        const record = await this.prisma.integracionMicrosoft.findUnique({
            where: { idUsuario: userId },
        });

        if (!record) return null;

        const integration = MicrosoftIntegrationMapper.toDomain(record);
        integration.refreshToken = this.decryptToken(integration.refreshToken);
        return integration;
    }

    async save(
        integration: MicrosoftIntegration,
    ): Promise<MicrosoftIntegration> {
        const data = MicrosoftIntegrationMapper.toPersistence(integration);
        const encryptedRefreshToken = this.encryptToken(data.refreshToken);

        if (integration.id) {
            const record = await this.prisma.integracionMicrosoft.update({
                where: { id: integration.id },
                data: {
                    microsoftEmail: data.microsoftEmail,
                    microsoftOid: data.microsoftOid,
                    refreshToken: encryptedRefreshToken,
                    tokenExpiresAt: data.tokenExpiresAt,
                    conectado: data.conectado,
                },
            });
            return this.toDecryptedDomain(record);
        }

        const record = await this.prisma.integracionMicrosoft.create({
            data: {
                idUsuario: data.idUsuario,
                microsoftEmail: data.microsoftEmail,
                microsoftOid: data.microsoftOid,
                refreshToken: encryptedRefreshToken,
                tokenExpiresAt: data.tokenExpiresAt,
                conectado: data.conectado,
            },
        });
        return this.toDecryptedDomain(record);
    }

    private toDecryptedDomain(
        record: Parameters<typeof MicrosoftIntegrationMapper.toDomain>[0],
    ): MicrosoftIntegration {
        const integration = MicrosoftIntegrationMapper.toDomain(record);
        integration.refreshToken = this.decryptToken(integration.refreshToken);
        return integration;
    }

    private encryptToken(token: string | null): string | null {
        return token ? this.encryption.encrypt(token) : null;
    }

    private decryptToken(token: string | null): string | null {
        if (!token) return null;
        // Compatibilidad con refreshToken guardados antes de introducir cifrado
        // en reposo: no tienen el formato iv:authTag:ciphertext, así que se
        // devuelven tal cual y quedan cifrados en el próximo save() (rotación
        // de token en MicrosoftCalendarSyncAdapter).
        if (token.split(':').length !== 3) {
            return token;
        }
        return this.encryption.decrypt(token);
    }
}
