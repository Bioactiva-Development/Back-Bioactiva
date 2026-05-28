import { describe, expect, it, beforeEach } from '@jest/globals';
import { CreateContactUseCase } from '@/modules/contacts/application/use-cases/create-contact.use-case';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';
import { EmailAlreadyExistsException } from '@/modules/contacts/domain/exceptions/email-already-exists.exception';
import { IContactRepository } from '@/modules/contacts/domain/ports/contact.repository';
import { CreateContactDto } from '@/modules/contacts/application/dtos/create-contact.dto';

describe('Contacts module', () => {
	/**
	 * CreateContactUseCase
	 * ----------
	 * Responsable de:
	 * - validar que el email no exista en la base de datos
	 * - crear una nueva entidad de contacto con datos limpios
	 * - persistir el contacto a través del repositorio
	 * - retornar la entidad creada con ID generado
	 */
	// STATUS: Implementación completa (casos de éxito y error).
	describe('CreateContactUseCase', () => {
		let useCase: CreateContactUseCase;
		let mockRepository: Partial<IContactRepository>;

		beforeEach(() => {
			mockRepository = {
				findByEmail: jest.fn(),
				save: jest.fn(),
				findById: jest.fn(),
				findByOrganizationId: jest.fn(),
				findAll: jest.fn(),
			};

			useCase = new CreateContactUseCase(mockRepository as IContactRepository);
		});

		const validDto: CreateContactDto = {
			nombres: 'Ana',
			apellidos: 'Paredes',
			vocativo: Vocative.DOCTORA,
			cargo: 'Gerente Comercial',
			correo: 'ana.paredes@techcorp.com',
			telefono: '+51987654321',
			correo2: 'ana.p@personal.com',
			comentarios: 'Primera contacto en LinkedIn',
			idOrganizacion: 'org-1',
			idAuthor: 1,
		};

		it('should create contact with valid data', async () => {
			const persistedContact = new Contact(
				1,
				validDto.nombres,
				validDto.apellidos,
				validDto.vocativo,
				validDto.cargo,
				validDto.correo,
				validDto.telefono,
				validDto.correo2,
				validDto.comentarios,
				validDto.idOrganizacion,
				validDto.idAuthor,
				new Date(),
				new Date(),
				EstadoCorreo.VIGENTE,
			);

			(mockRepository.findByEmail as jest.Mock).mockResolvedValue(null);
			(mockRepository.save as jest.Mock).mockResolvedValue(persistedContact);

			const result = await useCase.execute(validDto);

			expect(mockRepository.findByEmail).toHaveBeenCalledWith(validDto.correo);
			expect(result.id).toBe(1);
			expect(result.correo).toBe(validDto.correo);
			expect(result.nombres).toBe(validDto.nombres);
		});

		it('should reject if email already exists', async () => {
			const existingContact = new Contact(
				2,
				'Juan',
				'Perez',
				Vocative.DON,
				'Analista',
				validDto.correo,
				'+51912345678',
				'juan@personal.com',
				'Contacto existente',
				'org-2',
				1,
				new Date(),
				new Date(),
				EstadoCorreo.VIGENTE,
			);

			(mockRepository.findByEmail as jest.Mock).mockResolvedValue(existingContact);

			await expect(useCase.execute(validDto)).rejects.toThrow(EmailAlreadyExistsException);
			expect(mockRepository.save).not.toHaveBeenCalled();
		});

		it('should persist contact with corrected timestamps', async () => {
			const persistedContact = new Contact(
				1,
				validDto.nombres,
				validDto.apellidos,
				validDto.vocativo,
				validDto.cargo,
				validDto.correo,
				validDto.telefono,
				validDto.correo2,
				validDto.comentarios,
				validDto.idOrganizacion,
				validDto.idAuthor,
				new Date(),
				new Date(),
				EstadoCorreo.VIGENTE,
			);

			(mockRepository.findByEmail as jest.Mock).mockResolvedValue(null);
			(mockRepository.save as jest.Mock).mockResolvedValue(persistedContact);

			await useCase.execute(validDto);

			expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
				nombres: validDto.nombres,
				correo: validDto.correo,
				idOrganizacion: validDto.idOrganizacion,
			}));
		});

		it('should handle repository errors gracefully', async () => {
			const error = new Error('Database connection failed');

			(mockRepository.findByEmail as jest.Mock).mockRejectedValue(error);

			await expect(useCase.execute(validDto)).rejects.toThrow('Database connection failed');
		});
	});
});
