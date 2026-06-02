import { describe, expect, it } from '@jest/globals';
import { CreateContactDto } from '@/modules/contacts/application/dtos/create-contact.dto';
import { CreateOrganizationDto } from '@/modules/organizations/application/dtos/create-organization.dto';
import { UpdateOrganizationDto } from '@/modules/organizations/application/dtos/update-organization.dto';

describe('Application DTOs', () => {
    describe('CreateContactDto', () => {
        it('should create instance with all fields', () => {
            const dto = new CreateContactDto(
                'Juan', 'Perez', 'Ing.', 'Gerente',
                'juan@example.com', '999888777', 'juan2@example.com',
                'Comentario', 'org-1', 1,
            );
            expect(dto.nombres).toBe('Juan');
            expect(dto.apellidos).toBe('Perez');
            expect(dto.correo).toBe('juan@example.com');
            expect(dto.idOrganizacion).toBe('org-1');
            expect(dto.idAuthor).toBe(1);
        });
    });

    describe('CreateOrganizationDto', () => {
        it('should create instance with all fields', () => {
            const dto = new CreateOrganizationDto(
                'CLI-001', 'Empresa SAC', 'Empresa',
                'SubArea', '12345678901', 'CLIENTE',
                'https://linkedin.com', 'Lima', 'Tecnologia',
                'PEQUENIO', 'Comercio', 'Alianza', 'contact-1', 1,
            );
            expect(dto.nombre).toBe('Empresa SAC');
            expect(dto.ruc).toBe('12345678901');
            expect(dto.tipo).toBe('CLIENTE');
            expect(dto.idAuthor).toBe(1);
        });
    });

    describe('UpdateOrganizationDto', () => {
        it('should create instance with partial fields', () => {
            const dto = new UpdateOrganizationDto(
                undefined, 'Updated SAC', undefined,
                undefined, undefined, undefined,
                undefined, undefined, undefined,
                undefined, undefined, undefined, undefined, 1,
            );
            expect(dto.nombre).toBe('Updated SAC');
            expect(dto.codigoCliente).toBeUndefined();
            expect(dto.idAuthor).toBe(1);
        });
    });
});
