import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { OrganizationController } from '@/modules/organizations/infrastructure/http/organization.controller';
import { CreateOrganizationUseCase } from '@/modules/organizations/application/use-cases/create-organization.use-case';
import { UpdateOrganizationUseCase } from '@/modules/organizations/application/use-cases/update-organization.use-case';
import { GetOrganizationByIdUseCase } from '@/modules/organizations/application/use-cases/get-organization-by-id.use-case';
import { GetAllOrganizationsUseCase } from '@/modules/organizations/application/use-cases/get-all-organizations.use-case';
import { QuerySunatUseCase } from '@/modules/organizations/application/use-cases/query-sunat.use-case';
import { DeleteOrganizationUseCase } from '@/modules/organizations/application/use-cases/delete-organization.use-case';

describe('OrganizationController (branches)', () => {
    let controller: OrganizationController;
    let getAllOrganizationsUseCase: jest.Mocked<GetAllOrganizationsUseCase>;
    let querySunatUseCase: jest.Mocked<QuerySunatUseCase>;

    beforeEach(async () => {
        getAllOrganizationsUseCase = { execute: jest.fn() } as any;
        querySunatUseCase = { execute: jest.fn() } as any;

        const module = await Test.createTestingModule({
            controllers: [OrganizationController],
            providers: [
                {
                    provide: CreateOrganizationUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: UpdateOrganizationUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: GetOrganizationByIdUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: GetAllOrganizationsUseCase,
                    useValue: getAllOrganizationsUseCase,
                },
                { provide: QuerySunatUseCase, useValue: querySunatUseCase },
                {
                    provide: DeleteOrganizationUseCase,
                    useValue: { execute: jest.fn() },
                },
            ],
        }).compile();

        controller = module.get(OrganizationController);
    });

    it('findAll maps every optional filter when all are present', async () => {
        getAllOrganizationsUseCase.execute.mockResolvedValue({
            data: [],
            total: 0,
        });

        const query = {
            sector: 'TECNOLOGIA',
            tamano: 'GRANDE',
            tipo: 'PRIVADA',
            term: 'acme',
            page: 3,
            limit: 50,
        } as any;

        await controller.findAll(query);

        const [dto] = getAllOrganizationsUseCase.execute.mock.calls[0];
        expect(dto.sector).toBe('TECNOLOGIA');
        expect(dto.tamano).toBe('GRANDE');
        expect(dto.tipo).toBe('PRIVADA');
        expect(dto.term).toBe('acme');
    });

    it('findAll maps undefined optional filters when all are omitted', async () => {
        getAllOrganizationsUseCase.execute.mockResolvedValue({
            data: [],
            total: 0,
        });

        await controller.findAll({} as any);

        const [dto] = getAllOrganizationsUseCase.execute.mock.calls[0];
        expect(dto.sector).toBeUndefined();
        expect(dto.tamano).toBeUndefined();
        expect(dto.tipo).toBeUndefined();
        expect(dto.term).toBeUndefined();
    });

    it('querySunat wraps a single object result in a single response dto', async () => {
        querySunatUseCase.execute.mockResolvedValue({
            ruc: '12345678901',
            nombre: 'EMPRESA SAC',
        });

        const result = await controller.querySunat('12345678901');

        expect(Array.isArray(result)).toBe(false);
        expect((result as any).ruc).toBe('12345678901');
    });
});
