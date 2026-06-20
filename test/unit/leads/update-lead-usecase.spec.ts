import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UpdateLeadUseCase } from '@/modules/leads/application/use-cases/update-lead.use-case';
import { UpdateLeadDto } from '@/modules/leads/application/dto/update-lead.dto';
import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('Leads module', () => {
    describe('UpdateLeadUseCase', () => {
        let useCase: UpdateLeadUseCase;
        let leadRepository: any;
        let userRepository: any;

        const validOrgId = 'org-123';
        const validContactId = 10;
        const validEncargadoId = 5;

        const buildLead = () =>
            new Lead(
                1,
                validOrgId,
                validContactId,
                LeadState.EN_PROSPECTO,
                'Consultoría TI',
                'Comentario inicial',
                'Desafío inicial',
                validEncargadoId,
                'LinkedIn',
                1,
                new Date(),
                new Date(),
                null,
                new Date(),
            );

        beforeEach(() => {
            leadRepository = {
                findById: jest.fn(),
                saveWithRelations: jest.fn(),
            };

            userRepository = {
                findById: jest.fn(),
            };

            useCase = new UpdateLeadUseCase(leadRepository, userRepository);
        });

        it('should update lead fields', async () => {
            const existingLead = buildLead();
            leadRepository.findById.mockResolvedValue(existingLead);
            leadRepository.saveWithRelations.mockResolvedValue(existingLead);

            const dto = new UpdateLeadDto(
                'Nuevo servicio',
                'Nuevo comentario',
                'Nuevo desafío',
                'Web',
                undefined,
            );
            await useCase.execute(1, dto);

            expect(existingLead.servicio_interes).toBe('Nuevo servicio');
            expect(existingLead.comentarios).toBe('Nuevo comentario');
            expect(existingLead.desafio_oportunidad).toBe('Nuevo desafío');
            expect(existingLead.canal_captacion).toBe('Web');
            expect(leadRepository.saveWithRelations).toHaveBeenCalledWith(
                existingLead,
            );
        });

        it('should update encargado when provided', async () => {
            const existingLead = buildLead();
            leadRepository.findById.mockResolvedValue(existingLead);
            userRepository.findById.mockResolvedValue(
                new User(
                    10,
                    'Nuevo',
                    'Encargado',
                    'nuevo@example.com',
                    'hash',
                    new Date(),
                    UserRole.TRABAJADOR,
                    UserState.ACTIVO,
                    new Date(),
                ),
            );
            leadRepository.saveWithRelations.mockResolvedValue(existingLead);

            const dto = new UpdateLeadDto(
                undefined,
                undefined,
                undefined,
                undefined,
                10,
            );
            await useCase.execute(1, dto);

            expect(existingLead.id_encargado).toBe(10);
        });

        it('should not modify organization or contact', async () => {
            const existingLead = buildLead();
            leadRepository.findById.mockResolvedValue(existingLead);
            leadRepository.saveWithRelations.mockResolvedValue(existingLead);

            const dto = new UpdateLeadDto('Nuevo servicio');
            await useCase.execute(1, dto);

            expect(existingLead.id_org).toBe(validOrgId);
            expect(existingLead.id_contacto).toBe(validContactId);
        });

        it('should throw when lead is not found', async () => {
            leadRepository.findById.mockResolvedValue(null);

            const dto = new UpdateLeadDto();
            await expect(useCase.execute(999, dto)).rejects.toThrow(
                LeadNotFoundException,
            );
        });

        it('should throw when new encargado does not exist', async () => {
            const existingLead = buildLead();
            leadRepository.findById.mockResolvedValue(existingLead);
            userRepository.findById.mockResolvedValue(null);

            const dto = new UpdateLeadDto(
                undefined,
                undefined,
                undefined,
                undefined,
                999,
            );
            await expect(useCase.execute(1, dto)).rejects.toThrow(
                LeadNotFoundException,
            );
        });
    });
});
