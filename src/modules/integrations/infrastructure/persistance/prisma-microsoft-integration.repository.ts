import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { MicrosoftIntegration } from '@/modules/integrations/domain/entities/microsoft-integration';
import { MicrosoftIntegrationRepositoryPort } from '@/modules/integrations/domain/ports/microsoft-integration-repository.port';
import { MicrosoftIntegrationMapper } from '@/modules/integrations/infrastructure/persistance/mappers/microsoft-integration.mapper';

@Injectable()
export class PrismaMicrosoftIntegrationRepository implements MicrosoftIntegrationRepositoryPort {
    constructor(private readonly prisma: PrismaService) {}

    async findByUserId(userId: number): Promise<MicrosoftIntegration | null> {
        const record = await this.prisma.integracionMicrosoft.findUnique({
            where: { idUsuario: userId },
        });

        if (!record) return null;

        return MicrosoftIntegrationMapper.toDomain(record);
    }

    async save(
        integration: MicrosoftIntegration,
    ): Promise<MicrosoftIntegration> {
        const data = MicrosoftIntegrationMapper.toPersistence(integration);

        if (integration.id) {
            const record = await this.prisma.integracionMicrosoft.update({
                where: { id: integration.id },
                data: {
                    microsoftEmail: data.microsoftEmail,
                    microsoftOid: data.microsoftOid,
                    refreshToken: data.refreshToken,
                    tokenExpiresAt: data.tokenExpiresAt,
                    conectado: data.conectado,
                },
            });
            return MicrosoftIntegrationMapper.toDomain(record);
        }

        const record = await this.prisma.integracionMicrosoft.create({
            data: {
                idUsuario: data.idUsuario,
                microsoftEmail: data.microsoftEmail,
                microsoftOid: data.microsoftOid,
                refreshToken: data.refreshToken,
                tokenExpiresAt: data.tokenExpiresAt,
                conectado: data.conectado,
            },
        });
        return MicrosoftIntegrationMapper.toDomain(record);
    }
}
