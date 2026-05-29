import { describe, expect, it, beforeEach } from '@jest/globals';
import { CreateContactUseCase } from '@/modules/contacts/application/use-cases/create-contact.use-case';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';
import { EmailAlreadyExistsException } from '@/modules/contacts/domain/exceptions/email-already-exists.exception';

describe('Contacts module', () => {
	describe('CreateContactUseCase', () => {
		let useCase: CreateContactUseCase;
		let contactRepository: any;

		const createContactDto = {
			nombres: 'Juan',
			apellidos: 'Perez',
			vocativo: Vocative.SR,
			cargo: 'Manager',
			correo: 'juan@example.com',
			telefono: '987654321',
			correo2: null,
			comentarios: 'Test contact',
			idOrganizacion: 'org-123',
			idAuthor: 1,
		};

		beforeEach(() => {
			contactRepository = {
				findByEmail: jest.fn(),
				findBySecondaryEmail: jest.fn(),
				save: jest.fn(),
				findById: jest.fn(),
				findByIdWithOrganization: jest.fn(),
				findByOrganizationId: jest.fn(),
				findAll: jest.fn(),
			};

			useCase = new CreateContactUseCase(contactRepository);
		});

		it('should create contact with valid data', async () => {
			contactRepository.findByEmail.mockResolvedValue(null);
			contactRepository.findBySecondaryEmail.mockResolvedValue(null);
			const savedContact = new Contact(
				1,
				createContactDto.nombres,
				createContactDto.apellidos,
				createContactDto.vocativo,
				createContactDto.cargo,
				createContactDto.correo,
				createContactDto.telefono,
				createContactDto.correo2,
				createContactDto.comentarios,
				createContactDto.idOrganizacion,
				createContactDto.idAuthor,
				new Date(),
				new Date(),
			);
			contactRepository.save.mockResolvedValue(savedContact);
			contactRepository.findByIdWithOrganization.mockResolvedValue(savedContact);

			const result = await useCase.execute(createContactDto);

			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('nombres', createContactDto.nombres);
			expect(result).toHaveProperty('correo', createContactDto.correo);
			expect(contactRepository.findByEmail).toHaveBeenCalledWith(createContactDto.correo);
			expect(contactRepository.save).toHaveBeenCalled();
		});

		it('should throw error when email already exists', async () => {
			const existingContact = new Contact(
				1,
				'John',
				'Doe',
				Vocative.SR,
				'Dev',
				'juan@example.com',
				'987654321',
				null,
				'Existing',
				'org-123',
				1,
				new Date(),
				new Date(),
			);

			contactRepository.findByEmail.mockResolvedValue(existingContact);
			contactRepository.findByIdWithOrganization.mockResolvedValue(existingContact);

			await expect(useCase.execute(createContactDto)).rejects.toThrow(
				EmailAlreadyExistsException,
			);
		});

		it('should throw error when secondary email already exists', async () => {
			const dtoWithSecondaryEmail = {
				...createContactDto,
				correo2: 'secondary@example.com',
			};

			const existingContact = new Contact(
				2,
				'Jane',
				'Smith',
				Vocative.SRA,
				'Designer',
				'jane@example.com',
				'987654321',
				'secondary@example.com',
				'Existing',
				'org-123',
				1,
				new Date(),
				new Date(),
			);

			contactRepository.findByEmail.mockResolvedValue(null);
			contactRepository.findBySecondaryEmail.mockResolvedValue(existingContact);
			contactRepository.findByIdWithOrganization.mockResolvedValue(existingContact);

			await expect(useCase.execute(dtoWithSecondaryEmail)).rejects.toThrow(
				EmailAlreadyExistsException,
			);
		});

		it('should create contact without secondary email', async () => {
			const dtoWithoutSecondaryEmail = {
				...createContactDto,
				correo2: null,
			};

			contactRepository.findByEmail.mockResolvedValue(null);
			contactRepository.findBySecondaryEmail.mockResolvedValue(null);
			const savedContact = new Contact(
				1,
				dtoWithoutSecondaryEmail.nombres,
				dtoWithoutSecondaryEmail.apellidos,
				dtoWithoutSecondaryEmail.vocativo,
				dtoWithoutSecondaryEmail.cargo,
				dtoWithoutSecondaryEmail.correo,
				dtoWithoutSecondaryEmail.telefono,
				dtoWithoutSecondaryEmail.correo2,
				dtoWithoutSecondaryEmail.comentarios,
				dtoWithoutSecondaryEmail.idOrganizacion,
				dtoWithoutSecondaryEmail.idAuthor,
				new Date(),
				new Date(),
			);
			contactRepository.save.mockResolvedValue(savedContact);
			contactRepository.findByIdWithOrganization.mockResolvedValue(savedContact);

			const result = await useCase.execute(dtoWithoutSecondaryEmail);

			expect(result).toHaveProperty('correo2', null);
			expect(contactRepository.findBySecondaryEmail).not.toHaveBeenCalled();
		});

		it('should persist contact with corrected timestamps', async () => {
			contactRepository.findByEmail.mockResolvedValue(null);
			contactRepository.findBySecondaryEmail.mockResolvedValue(null);
			const beforeCreate = new Date();
			const savedContact = new Contact(
				1,
				createContactDto.nombres,
				createContactDto.apellidos,
				createContactDto.vocativo,
				createContactDto.cargo,
				createContactDto.correo,
				createContactDto.telefono,
				createContactDto.correo2,
				createContactDto.comentarios,
				createContactDto.idOrganizacion,
				createContactDto.idAuthor,
				beforeCreate,
				beforeCreate,
			);
			contactRepository.save.mockResolvedValue(savedContact);
			contactRepository.findByIdWithOrganization.mockResolvedValue(savedContact);

			const result = await useCase.execute(createContactDto);

			expect(result.createdAt).toBeDefined();
			expect(result.updatedAt).toBeDefined();
			expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
		});

		it('should save contact with all required fields', async () => {
			contactRepository.findByEmail.mockResolvedValue(null);
			contactRepository.findBySecondaryEmail.mockResolvedValue(null);
			const savedContact = new Contact(
				1,
				createContactDto.nombres,
				createContactDto.apellidos,
				createContactDto.vocativo,
				createContactDto.cargo,
				createContactDto.correo,
				createContactDto.telefono,
				createContactDto.correo2,
				createContactDto.comentarios,
				createContactDto.idOrganizacion,
				createContactDto.idAuthor,
				new Date(),
				new Date(),
			);
			contactRepository.save.mockResolvedValue(savedContact);

			await useCase.execute(createContactDto);

			expect(contactRepository.save).toHaveBeenCalledWith(
				expect.objectContaining({
					nombres: createContactDto.nombres,
					apellidos: createContactDto.apellidos,
					vocativo: createContactDto.vocativo,
					correo: createContactDto.correo,
					telefono: createContactDto.telefono,
					idOrganizacion: createContactDto.idOrganizacion,
				}),
			);
		});
	});
});
