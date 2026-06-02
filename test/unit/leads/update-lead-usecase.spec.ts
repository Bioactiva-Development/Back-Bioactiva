import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UpdateLeadUseCase } from '@/modules/leads/application/use-cases/update-lead.use-case';
import { UpdateLeadDto } from '@/modules/leads/application/dto/update-lead.dto';
import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import { LeadContactInvalidException } from '@/modules/leads/domain/exceptions/lead-contact-invalid.exception';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Size } from '@/modules/organizations/domain/enums/size';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('Leads module', () => {
    describe('UpdateLeadUseCase', () => {
        let useCase: UpdateLeadUseCase;
        let leadRepository: any;
        let organizationRepository: any;
        let contactRepository: any;
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
                'Nota inicial',
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

            organizationRepository = {
                findById: jest.fn(),
            };

            contactRepository = {
                findById: jest.fn(),
            };

            userRepository = {
                findById: jest.fn(),
            };

            useCase = new UpdateLeadUseCase(
                leadRepository,
                organizationRepository,
                contactRepository,
                userRepository,
            );
        });

        it('should update lead fields', async () => {
            const existingLead = buildLead();
            leadRepository.findById.mockResolvedValue(existingLead);
            leadRepository.saveWithRelations.mockResolvedValue(existingLead);

            const dto = new UpdateLeadDto(
                undefined,
                undefined,
                'Nuevo servicio',
                'Nuevo comentario',
                'Nuevo desafío',
                'Nueva nota',
                'Web',
                undefined,
            );
            await useCase.execute(1, dto);

            expect(existingLead.servicio_interes).toBe('Nuevo servicio');
            expect(existingLead.comentarios).toBe('Nuevo comentario');
            expect(existingLead.desafio_oportunidad).toBe('Nuevo desafío');
            expect(existingLead.notas_contacto).toBe('Nueva nota');
            expect(existingLead.canal_captacion).toBe('Web');
            expect(leadRepository.saveWithRelations).toHaveBeenCalledWith(
                existingLead,
            );
        });

        it('should update organization when provided', async () => {
            const existingLead = buildLead();
            leadRepository.findById.mockResolvedValue(existingLead);
            organizationRepository.findById.mockResolvedValue(
                new Organization(
                    'new-org',
                    'CLI-002',
                    'Nueva Org',
                    'Nueva',
                    null,
                    null,
                    EnterpriseType.EMPRESA_NACIONAL,
                    null,
                    null,
                    null,
                    Size.PEQUENO,
                    null,
                    null,
                    null,
                    1,
                    new Date(),
                    new Date(),
                ),
            );
            leadRepository.saveWithRelations.mockResolvedValue(existingLead);

            const dto = new UpdateLeadDto('new-org');
            await useCase.execute(1, dto);

            expect(existingLead.id_org).toBe('new-org');
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
                undefined,
                undefined,
                undefined,
                10,
            );
            await useCase.execute(1, dto);

            expect(existingLead.id_encargado).toBe(10);
        });

        it('should update contacto when provided', async () => {
            const existingLead = buildLead();
            leadRepository.findById.mockResolvedValue(existingLead);
            const newContact = new Contact(
                20,
                'Nuevo',
                'Contacto',
                Vocative.SR,
                'Analista',
                'nuevo@example.com',
                null,
                null,
                null,
                validOrgId,
                1,
                new Date(),
                new Date(),
                EstadoCorreo.VIGENTE,
            );
            contactRepository.findById.mockResolvedValue(newContact);
            leadRepository.saveWithRelations.mockResolvedValue(existingLead);

            const dto = new UpdateLeadDto(
                undefined,
                20,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
            );
            await useCase.execute(1, dto);

            expect(existingLead.id_contacto).toBe(20);
        });

        it('should detach contact when setting idContacto to null', async () => {
            const existingLead = buildLead();
            leadRepository.findById.mockResolvedValue(existingLead);
            leadRepository.saveWithRelations.mockResolvedValue(existingLead);

            const dto = new UpdateLeadDto(undefined, null);
            await useCase.execute(1, dto);

            expect(existingLead.id_contacto).toBeNull();
        });

        it('should throw when lead is not found', async () => {
            leadRepository.findById.mockResolvedValue(null);

            const dto = new UpdateLeadDto();
            await expect(useCase.execute(999, dto)).rejects.toThrow(
                LeadNotFoundException,
            );
        });

        it('should throw when new organization does not exist', async () => {
            const existingLead = buildLead();
            leadRepository.findById.mockResolvedValue(existingLead);
            organizationRepository.findById.mockResolvedValue(null);

            const dto = new UpdateLeadDto('non-existent-org');
            await expect(useCase.execute(1, dto)).rejects.toThrow(
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
                undefined,
                undefined,
                undefined,
                999,
            );
            await expect(useCase.execute(1, dto)).rejects.toThrow(
                LeadNotFoundException,
            );
        });

        it('should throw when new contact does not exist', async () => {
            const existingLead = buildLead();
            leadRepository.findById.mockResolvedValue(existingLead);
            contactRepository.findById.mockResolvedValue(null);

            const dto = new UpdateLeadDto(undefined, 999);
            await expect(useCase.execute(1, dto)).rejects.toThrow(
                LeadContactInvalidException,
            );
        });

        it('should throw when new contact belongs to different organization', async () => {
            const existingLead = buildLead();
            leadRepository.findById.mockResolvedValue(existingLead);
            const wrongOrgContact = new Contact(
                20,
                'Otro',
                'Contacto',
                Vocative.SR,
                'Analista',
                'otro@example.com',
                null,
                null,
                null,
                'other-org',
                1,
                new Date(),
                new Date(),
                EstadoCorreo.VIGENTE,
            );
            contactRepository.findById.mockResolvedValue(wrongOrgContact);

            const dto = new UpdateLeadDto(undefined, 20);
            await expect(useCase.execute(1, dto)).rejects.toThrow(
                LeadContactInvalidException,
            );
        });

        it('should throw when new contact is not vigente', async () => {
            const existingLead = buildLead();
            leadRepository.findById.mockResolvedValue(existingLead);
            const expiredContact = new Contact(
                20,
                'Vencido',
                'Contacto',
                Vocative.SR,
                'Analista',
                'vencido@example.com',
                null,
                null,
                null,
                validOrgId,
                1,
                new Date(),
                new Date(),
                EstadoCorreo.VENCIDO,
            );
            contactRepository.findById.mockResolvedValue(expiredContact);

            const dto = new UpdateLeadDto(undefined, 20);
            await expect(useCase.execute(1, dto)).rejects.toThrow(
                LeadContactInvalidException,
            );
        });
    });
});
