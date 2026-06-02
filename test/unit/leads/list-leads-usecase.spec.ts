import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ListLeadsUseCase } from '@/modules/leads/application/use-cases/list-leads.use-case';
import { ListLeadsDto } from '@/modules/leads/application/dto/list-leads.dto';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';

describe('Leads module', () => {
    describe('ListLeadsUseCase', () => {
        let useCase: ListLeadsUseCase;
        let leadRepository: any;

        beforeEach(() => {
            leadRepository = {
                list: jest.fn(),
                count: jest.fn(),
            };

            useCase = new ListLeadsUseCase(leadRepository);
        });

        it('should return paginated results', async () => {
            const mockData = [
                { id: 1, estado: 'EN_PROSPECTO' },
                { id: 2, estado: 'OFERTADO' },
            ];
            leadRepository.list.mockResolvedValue(mockData);
            leadRepository.count.mockResolvedValue(2);

            const dto = new ListLeadsDto(
                undefined,
                undefined,
                undefined,
                undefined,
                1,
                10,
            );
            const result = await useCase.execute(dto);

            expect(result.data).toEqual(mockData);
            expect(result.total).toBe(2);
            expect(leadRepository.list).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
            });
            expect(leadRepository.count).toHaveBeenCalledWith({});
        });

        it('should pass filters to repository', async () => {
            leadRepository.list.mockResolvedValue([]);
            leadRepository.count.mockResolvedValue(0);

            const dto = new ListLeadsDto(
                LeadState.EN_PROSPECTO,
                'org-123',
                5,
                'consultoría',
                1,
                10,
            );
            await useCase.execute(dto);

            expect(leadRepository.list).toHaveBeenCalledWith({
                estado: LeadState.EN_PROSPECTO,
                idOrg: 'org-123',
                idEncargado: 5,
                search: 'consultoría',
                page: 1,
                limit: 10,
            });
            expect(leadRepository.count).toHaveBeenCalledWith({
                estado: LeadState.EN_PROSPECTO,
                idOrg: 'org-123',
                idEncargado: 5,
                search: 'consultoría',
            });
        });

        it('should use default pagination when not provided', async () => {
            leadRepository.list.mockResolvedValue([]);
            leadRepository.count.mockResolvedValue(0);

            const dto = new ListLeadsDto();
            await useCase.execute(dto);

            expect(leadRepository.list).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
            });
        });
    });
});
