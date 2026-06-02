import { IntegracionMicrosoft as IntegracionMicrosoftPrisma } from '@prisma/client';
import { MicrosoftIntegration } from '@/modules/integrations/domain/entities/microsoft-integration';

export class MicrosoftIntegrationMapper {
    static toDomain(record: IntegracionMicrosoftPrisma): MicrosoftIntegration {
        return new MicrosoftIntegration(
            record.id,
            record.idUsuario,
            record.microsoftEmail,
            record.microsoftOid,
            record.refreshToken,
            record.tokenExpiresAt,
            record.conectado,
            record.createdAt,
            record.updatedAt,
        );
    }

    static toPersistence(
        domain: MicrosoftIntegration,
    ): IntegracionMicrosoftPrisma {
        return {
            id: domain.id ?? 0,
            idUsuario: domain.idUsuario,
            microsoftEmail: domain.microsoftEmail,
            microsoftOid: domain.microsoftOid,
            refreshToken: domain.refreshToken,
            tokenExpiresAt: domain.tokenExpiresAt,
            conectado: domain.conectado,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }
}
