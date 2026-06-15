import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateLeadUseCase } from '@/modules/leads/application/use-cases/create-lead.use-case';
import { CreateLeadDto } from '@/modules/leads/application/dto/create-lead.dto';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import { LeadContactInvalidException } from '@/modules/leads/domain/exceptions/lead-contact-invalid.exception';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Size } from '@/modules/organizations/domain/enums/size';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';
import { Lead } from '@/modules/leads/domain/entities/lead';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('Leads module', () => {
    describe('CreateLeadUseCase', () => {
        let useCase: CreateLeadUseCase;
        let leadRepository: any;
        let organizationRepository: any;
        let contactRepository: any;
        let userRepository: any;

        const validOrgId = 'org-123';
        const validContactId = 10;
        const validEncargadoId = 5;
        const validAuthorId = 1;

        const buildOrganization = () =>
            new Organization(
                validOrgId,
                'CLI-001',
                'Bioactiva SAC',
                'Bioactiva',
                null,
                '12345678901',
                EnterpriseType.EMPRESA_NACIONAL,
                null,
                null,
                null,
                Size.MEDIANO,
                null,
                null,
                null,
                validAuthorId,
                new Date(),
                new Date(),
            );

        const buildContact = () =>
            new Contact(
                validContactId,
                'Juan',
                'Pérez',
                Vocative.SR,
                'Gerente',
                'juan@example.com',
                '999888777',
                null,
                null,
                validOrgId,
                validAuthorId,
                new Date(),
                new Date(),
                EstadoCorreo.VIGENTE,
            );

        const buildEncargado = () =>
            new User(
                validEncargadoId,
                'Carlos',
                'López',
                'carlos@example.com',
                'hash',
                new Date(),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date(),
            );

        const buildDto = (overrides?: Partial<CreateLeadDto>): CreateLeadDto =>
            new CreateLeadDto(
                overrides?.idOrg !== undefined ? overrides.idOrg : validOrgId,
                overrides?.idContacto !== undefined
                    ? overrides.idContacto
                    : validContactId,
                overrides?.servicioInteres ?? 'Consultoría TI',
                overrides?.comentarios ?? null,
                overrides?.desafioOportunidad ?? null,
                overrides?.canalCaptacion ?? null,
                overrides?.idEncargado ?? validEncargadoId,
                overrides?.idAuthor ?? validAuthorId,
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

            useCase = new CreateLeadUseCase(
                leadRepository,
                organizationRepository,
                contactRepository,
                userRepository,
            );
        });

        it('should create lead with valid data', async () => {
            organizationRepository.findById.mockResolvedValue(
                buildOrganization(),
            );
            contactRepository.findById.mockResolvedValue(buildContact());
            userRepository.findById.mockResolvedValue(buildEncargado());
            const savedLead = new Lead(
                null,
                validOrgId,
                validContactId,
                LeadState.EN_PROSPECTO,
                'Consultoría TI',
                null,
                null,
                null,
                validEncargadoId,
                null,
                validAuthorId,
                new Date(),
                new Date(),
                null,
                new Date(),
            );
            leadRepository.saveWithRelations.mockResolvedValue(savedLead);

            const result = await useCase.execute(buildDto());

            expect(result).toBeDefined();
            expect(organizationRepository.findById).toHaveBeenCalledWith(
                validOrgId,
            );
            expect(contactRepository.findById).toHaveBeenCalledWith(
                validContactId,
            );
            expect(userRepository.findById).toHaveBeenCalledWith(
                validEncargadoId,
            );
            expect(leadRepository.saveWithRelations).toHaveBeenCalled();
        });

        it('should throw when organization does not exist', async () => {
            organizationRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(buildDto())).rejects.toThrow(
                LeadNotFoundException,
            );
        });

        it('should throw when contact does not exist', async () => {
            organizationRepository.findById.mockResolvedValue(
                buildOrganization(),
            );
            contactRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(buildDto())).rejects.toThrow(
                LeadContactInvalidException,
            );
        });

        it('should throw when contact belongs to different organization', async () => {
            organizationRepository.findById.mockResolvedValue(
                buildOrganization(),
            );
            const otherOrgContact = buildContact();
            otherOrgContact.idOrganizacion = 'other-org';
            contactRepository.findById.mockResolvedValue(otherOrgContact);

            await expect(useCase.execute(buildDto())).rejects.toThrow(
                LeadContactInvalidException,
            );
        });

        it('should throw when contact is not vigente', async () => {
            organizationRepository.findById.mockResolvedValue(
                buildOrganization(),
            );
            const expiredContact = buildContact();
            expiredContact.estado_correo = EstadoCorreo.VENCIDO;
            contactRepository.findById.mockResolvedValue(expiredContact);

            await expect(useCase.execute(buildDto())).rejects.toThrow(
                LeadContactInvalidException,
            );
        });

        it('should throw when encargado does not exist', async () => {
            organizationRepository.findById.mockResolvedValue(
                buildOrganization(),
            );
            contactRepository.findById.mockResolvedValue(buildContact());
            userRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(buildDto())).rejects.toThrow(
                LeadNotFoundException,
            );
        });

        it('should create lead without contact when idContacto is null', async () => {
            organizationRepository.findById.mockResolvedValue(
                buildOrganization(),
            );
            userRepository.findById.mockResolvedValue(buildEncargado());
            leadRepository.saveWithRelations.mockResolvedValue(
                new Lead(
                    null,
                    validOrgId,
                    null,
                    LeadState.EN_PROSPECTO,
                    'Consultoría TI',
                    null,
                    null,
                    null,
                    validEncargadoId,
                    null,
                    validAuthorId,
                    new Date(),
                    new Date(),
                    null,
                    new Date(),
                ),
            );

            const dto = buildDto({ idContacto: null });
            const result = await useCase.execute(dto);

            expect(result).toBeDefined();
            expect(contactRepository.findById).not.toHaveBeenCalled();
        });

        it('should assign EN_PROSPECTO as initial state', async () => {
            organizationRepository.findById.mockResolvedValue(
                buildOrganization(),
            );
            contactRepository.findById.mockResolvedValue(buildContact());
            userRepository.findById.mockResolvedValue(buildEncargado());

            let savedLeadState: LeadState | null = null;
            leadRepository.saveWithRelations.mockImplementation(
                (lead: Lead) => {
                    savedLeadState = lead.estado;
                    return lead;
                },
            );

            await useCase.execute(buildDto());

            expect(savedLeadState).toBe(LeadState.EN_PROSPECTO);
        });
    });
});
