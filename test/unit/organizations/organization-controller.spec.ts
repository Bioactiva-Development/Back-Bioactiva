import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrganizationController } from '@/modules/organizations/infrastructure/http/organization.controller';
import { CreateOrganizationUseCase } from '@/modules/organizations/application/use-cases/create-organization.use-case';
import { UpdateOrganizationUseCase } from '@/modules/organizations/application/use-cases/update-organization.use-case';
import { GetOrganizationByIdUseCase } from '@/modules/organizations/application/use-cases/get-organization-by-id.use-case';
import { GetAllOrganizationsUseCase } from '@/modules/organizations/application/use-cases/get-all-organizations.use-case';
import { QuerySunatUseCase } from '@/modules/organizations/application/use-cases/query-sunat.use-case';

describe('OrganizationController', () => {
    let controller: OrganizationController;
    let createOrganizationUseCase: jest.Mocked<CreateOrganizationUseCase>;
    let updateOrganizationUseCase: jest.Mocked<UpdateOrganizationUseCase>;
    let getOrganizationByIdUseCase: jest.Mocked<GetOrganizationByIdUseCase>;
    let getAllOrganizationsUseCase: jest.Mocked<GetAllOrganizationsUseCase>;
    let querySunatUseCase: jest.Mocked<QuerySunatUseCase>;

    beforeEach(async () => {
        createOrganizationUseCase = { execute: jest.fn() } as any;
        updateOrganizationUseCase = { execute: jest.fn() } as any;
        getOrganizationByIdUseCase = { execute: jest.fn() } as any;
        getAllOrganizationsUseCase = { execute: jest.fn() } as any;
        querySunatUseCase = { execute: jest.fn() } as any;

        const module = await Test.createTestingModule({
            controllers: [OrganizationController],
            providers: [
                {
                    provide: CreateOrganizationUseCase,
                    useValue: createOrganizationUseCase,
                },
                {
                    provide: UpdateOrganizationUseCase,
                    useValue: updateOrganizationUseCase,
                },
                {
                    provide: GetOrganizationByIdUseCase,
                    useValue: getOrganizationByIdUseCase,
                },
                {
                    provide: GetAllOrganizationsUseCase,
                    useValue: getAllOrganizationsUseCase,
                },
                { provide: QuerySunatUseCase, useValue: querySunatUseCase },
            ],
        }).compile();

        controller = module.get(OrganizationController);
    });

    it('should create organization', async () => {
        createOrganizationUseCase.execute.mockResolvedValue({
            id: 'org-1',
            nombre: 'Empresa SAC',
        });
        const dto = { nombre: 'Empresa SAC', ruc: '12345678901' } as any;
        const result = await controller.create(dto);
        expect(createOrganizationUseCase.execute).toHaveBeenCalledWith(dto);
        expect(result.nombre).toBe('Empresa SAC');
    });

    it('should find all organizations', async () => {
        getAllOrganizationsUseCase.execute.mockResolvedValue([
            { id: 'org-1', nombre: 'Empresa SAC' },
        ]);
        const result = await controller.findAll();
        expect(result).toHaveLength(1);
    });

    it('should find organization by id with embedded contacts', async () => {
        getOrganizationByIdUseCase.execute.mockResolvedValue({
            organization: { id: 'org-1', nombre: 'Empresa SAC' },
            contactos: [
                {
                    contact: { id: 1, nombres: 'Juan' },
                    organizationName: 'Empresa SAC',
                },
            ],
            totalContactos: 14,
        });
        const result = await controller.findOne('org-1');
        expect(getOrganizationByIdUseCase.execute).toHaveBeenCalledWith(
            'org-1',
        );
        expect(result.nombre).toBe('Empresa SAC');
        expect(result.contactos).toHaveLength(1);
        expect(result.contactos[0].nombres).toBe('Juan');
        expect(result.totalContactos).toBe(14);
    });

    it('should throw NotFoundException when organization not found', async () => {
        getOrganizationByIdUseCase.execute.mockResolvedValue(null);
        await expect(controller.findOne('missing')).rejects.toThrow(
            NotFoundException,
        );
    });

    it('should update organization', async () => {
        updateOrganizationUseCase.execute.mockResolvedValue({
            id: 'org-1',
            nombre: 'Updated',
        });
        const dto = { nombre: 'Updated' } as any;
        const result = await controller.update('org-1', dto);
        expect(updateOrganizationUseCase.execute).toHaveBeenCalledWith(
            'org-1',
            dto,
        );
        expect(result.nombre).toBe('Updated');
    });

    it('should query SUNAT and return results', async () => {
        querySunatUseCase.execute.mockResolvedValue([
            { ruc: '12345678901', nombre: 'EMPRESA SAC' },
        ]);
        const result = await controller.querySunat('12345678901');
        expect(querySunatUseCase.execute).toHaveBeenCalledWith('12345678901');
        expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException when SUNAT query returns empty array', async () => {
        querySunatUseCase.execute.mockResolvedValue([]);
        await expect(controller.querySunat('00000000000')).rejects.toThrow(
            NotFoundException,
        );
    });

    it('should throw NotFoundException when SUNAT query returns null', async () => {
        querySunatUseCase.execute.mockResolvedValue(null);
        await expect(controller.querySunat('00000000000')).rejects.toThrow(
            NotFoundException,
        );
    });
});
