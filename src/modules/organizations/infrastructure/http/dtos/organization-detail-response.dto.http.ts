import { ApiProperty } from '@nestjs/swagger';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { OrganizationResponseDto } from '@/modules/organizations/infrastructure/http/dtos/organization-response.dto.http';
import { ContactResponseDto } from '@/modules/contacts/infrastructure/http/dtos/contact-response.dto';
import { ContactWithOrgName } from '@/modules/contacts/domain/ports/contact.repository';

export class OrganizationDetailResponseDto extends OrganizationResponseDto {
    @ApiProperty({
        type: [ContactResponseDto],
        description: 'Primeros contactos asociados a la organización (máx. 6)',
    })
    contactos: ContactResponseDto[];

    @ApiProperty({
        example: 14,
        description: 'Total de contactos asociados a la organización',
    })
    totalContactos: number;

    constructor(
        org: Organization,
        contactos: ContactWithOrgName[],
        totalContactos: number,
    ) {
        super(org);
        this.contactos = contactos.map((c) => new ContactResponseDto(c));
        this.totalContactos = totalContactos;
    }
}
