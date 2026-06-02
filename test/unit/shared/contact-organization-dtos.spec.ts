import { describe, expect, it } from '@jest/globals';
import { HttpCreateContactDto } from '@/modules/contacts/infrastructure/http/dtos/create-contact.dto.http';
import { HttpUpdateContactDto } from '@/modules/contacts/infrastructure/http/dtos/update-contact.dto.http';
import { ContactResponseDto } from '@/modules/contacts/infrastructure/http/dtos/contact-response.dto';
import { HttpCreateOrganizationDto } from '@/modules/organizations/infrastructure/http/dtos/create-organization.dto.http';
import { HttpUpdateOrganizationDto } from '@/modules/organizations/infrastructure/http/dtos/update-organization.dto.http';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';
import type { ContactWithOrgName } from '@/modules/contacts/domain/ports/contact.repository';

describe('Contact DTOs', () => {
    describe('HttpCreateContactDto', () => {
        it('should create instance with all fields', () => {
            const dto = new HttpCreateContactDto();
            dto.nombres = 'Juan';
            dto.apellidos = 'Perez';
            dto.correo = 'juan@example.com';
            dto.idOrganizacion = 'org-1';
            expect(dto.nombres).toBe('Juan');
            expect(dto.apellidos).toBe('Perez');
            expect(dto.correo).toBe('juan@example.com');
            expect(dto.idOrganizacion).toBe('org-1');
        });
    });

    describe('HttpUpdateContactDto', () => {
        it('should create instance with optional fields', () => {
            const dto = new HttpUpdateContactDto();
            dto.nombres = 'Juan Updated';
            dto.cargo = 'Gerente';
            expect(dto.nombres).toBe('Juan Updated');
            expect(dto.cargo).toBe('Gerente');
        });
    });

    describe('ContactResponseDto', () => {
        it('should create instance with all fields', () => {
            const createdAt = new Date('2024-01-01T10:30:00.000Z');
            const updatedAt = new Date('2024-01-02T10:30:00.000Z');
            const contact = new Contact(
                1,
                'Ana',
                'Lopez',
                Vocative.SRA,
                'Gerente',
                'ana@example.com',
                '999888777',
                'ana2@example.com',
                'Comentario',
                'org-1',
                1,
                createdAt,
                updatedAt,
            );
            const enriched: ContactWithOrgName = {
                contact,
                organizationName: 'Org A',
            };
            const dto = new ContactResponseDto(enriched);

            expect(dto.id).toBe(1);
            expect(dto.nombres).toBe('Ana');
            expect(dto.apellidos).toBe('Lopez');
            expect(dto.correo).toBe('ana@example.com');
            expect(dto.organizacionNombre).toBe('Org A');
            expect(dto.createdAt).toEqual(createdAt);
        });
    });
});

describe('Organization DTOs', () => {
    describe('HttpCreateOrganizationDto', () => {
        it('should create instance with all fields', () => {
            const dto = new HttpCreateOrganizationDto();
            dto.nombre = 'Empresa SAC';
            dto.nombreComercial = 'Empresa';
            dto.ruc = '12345678901';
            dto.tipo = 'CLIENTE';
            expect(dto.nombre).toBe('Empresa SAC');
            expect(dto.nombreComercial).toBe('Empresa');
            expect(dto.ruc).toBe('12345678901');
            expect(dto.tipo).toBe('CLIENTE');
        });
    });

    describe('HttpUpdateOrganizationDto', () => {
        it('should create instance with optional fields', () => {
            const dto = new HttpUpdateOrganizationDto();
            dto.nombre = 'Updated SAC';
            dto.linkedin = 'https://linkedin.com/company/updated';
            expect(dto.nombre).toBe('Updated SAC');
            expect(dto.linkedin).toBe('https://linkedin.com/company/updated');
        });
    });
});
