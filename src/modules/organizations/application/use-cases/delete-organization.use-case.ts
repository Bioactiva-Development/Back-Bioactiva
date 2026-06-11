import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { ORGANIZATION_REPOSITORY } from '@/modules/organizations/domain/ports/organization.repository';
import type { IOrganizationRepository } from '@/modules/organizations/domain/ports/organization.repository';
import { OrganizationNotFoundException } from '@/modules/organizations/domain/exceptions/organization-not-found.exception';

export class DeleteOrganizationUseCase {
    constructor(
        @Inject(ORGANIZATION_REPOSITORY)
        private readonly organizationRepository: IOrganizationRepository,
    ) {}

    async execute(id: string): Promise<{ ok: true }> {
        const organization = await this.organizationRepository.findById(id);
        if (!organization) {
            throw new OrganizationNotFoundException(
                `Organización con id ${id} no encontrada`,
            );
        }

        // Soft-delete: preserva el registro (y su codigoCliente) y, en la misma
        // transacción, marca los contactos de la organización como VENCIDO.
        await this.organizationRepository.softDelete(id);

        return { ok: true };
    }
}
