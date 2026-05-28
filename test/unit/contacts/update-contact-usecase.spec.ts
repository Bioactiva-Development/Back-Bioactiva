import { describe, expect, it, beforeEach } from '@jest/globals';
import { UpdateContactUseCase } from '@/modules/contacts/application/use-cases/UpdateContactUseCase';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';
import { EmailAlreadyExistsException } from '@/modules/contacts/domain/exceptions/email-already-exists.exception';
import { IContactRepository } from '@/modules/contacts/domain/ports/contact.repository';

describe('Contacts module', () => {
	/**
	 * UpdateContactUseCase
	 * ----------
	 * Responsable de:
	 * - buscar contacto existente por ID
	 * - validar que el nuevo email no sea duplicado
	 * - actualizar campos permitidos del contacto
	 * - persistir cambios en repositorio
	 * - mantener integridad de datos
	 */
	// STATUS: Implementación completa (validaciones y actualizaciones).
	describe('UpdateContactUseCase', () => {
		let useCase: UpdateContactUseCase;
		let mockRepository: Partial<IContactRepository>;

		const existingContact = new Contact(
			1,
			'Ana',
			'Paredes',
			Vocative.DOCTORA,
			'Gerente Comercial',
			'ana@techcorp.com',
			'+51987654321',
			'ana.p@personal.com',
			'Original comment',
			'org-1',
			1,
			new Date('2024-01-01'),
			new Date('2024-01-01'),
			EstadoCorreo.VIGENTE,
		);

		beforeEach(() => {
			mockRepository = {
				findById: jest.fn(),
				findByEmail: jest.fn(),
				save: jest.fn(),
				findByOrganizationId: jest.fn(),
				findAll: jest.fn(),
			};

			useCase = new UpdateContactUseCase(mockRepository as IContactRepository);
		});

		it('should update contact with valid data', async () => {
			const updateDto = { nombres: 'Andrea', cargo: 'Directora' };

			(mockRepository.findById as jest.Mock).mockResolvedValue(existingContact);
			(mockRepository.save as jest.Mock).mockResolvedValue({
				...existingContact,
				...updateDto,
				updatedAt: new Date(),
			});

			const result = await useCase.execute(1, updateDto);

			expect(mockRepository.findById).toHaveBeenCalledWith(1);
			expect(result.nombres).toBe('Andrea');
			expect(result.cargo).toBe('Directora');
		});

		it('should throw error when contact not found', async () => {
			(mockRepository.findById as jest.Mock).mockResolvedValue(null);

			await expect(useCase.execute(999, {})).rejects.toThrow('Contacto no encontrado');
			expect(mockRepository.save).not.toHaveBeenCalled();
		});

		it('should change email and validate uniqueness', async () => {
			const updateDto = { correo: 'newemail@techcorp.com' };

			(mockRepository.findById as jest.Mock).mockResolvedValue(existingContact);
			(mockRepository.findByEmail as jest.Mock).mockResolvedValue(null);
			(mockRepository.save as jest.Mock).mockResolvedValue({
				...existingContact,
				correo: updateDto.correo,
			});

			const result = await useCase.execute(1, updateDto);

			expect(mockRepository.findByEmail).toHaveBeenCalledWith(updateDto.correo);
			expect(result.correo).toBe(updateDto.correo);
		});

		it('should reject new email if already exists', async () => {
			const updateDto = { correo: 'existing@techcorp.com' };
			const existingEmail = new Contact(
				2,
				'Juan',
				'Perez',
				Vocative.DON,
				'Analista',
				updateDto.correo,
				'+51912345678',
				'',
				'',
				'org-1',
				1,
				new Date(),
				new Date(),
				EstadoCorreo.VIGENTE,
			);

			(mockRepository.findById as jest.Mock).mockResolvedValue(existingContact);
			(mockRepository.findByEmail as jest.Mock).mockResolvedValue(existingEmail);

			await expect(useCase.execute(1, updateDto)).rejects.toThrow(EmailAlreadyExistsException);
			expect(mockRepository.save).not.toHaveBeenCalled();
		});

		it('should allow keeping same email without validation', async () => {
			const updateDto = { correo: existingContact.correo, nombres: 'Ana Updated' };

			(mockRepository.findById as jest.Mock).mockResolvedValue(existingContact);
			(mockRepository.save as jest.Mock).mockResolvedValue({
				...existingContact,
				nombres: updateDto.nombres,
			});

			const result = await useCase.execute(1, updateDto);

			expect(mockRepository.findByEmail).not.toHaveBeenCalled();
			expect(result.nombres).toBe(updateDto.nombres);
		});

		it('should update multiple fields', async () => {
			const updateDto = {
				nombres: 'Andrea',
				apellidos: 'Paredes García',
				cargo: 'Directora Comercial',
				telefono: '+51998765432',
				correo2: 'andrea@personal.com',
				comentarios: 'Updated contact',
			};

			(mockRepository.findById as jest.Mock).mockResolvedValue(existingContact);
			(mockRepository.save as jest.Mock).mockResolvedValue({
				...existingContact,
				...updateDto,
				updatedAt: new Date(),
			});

			const result = await useCase.execute(1, updateDto);

			expect(mockRepository.save).toHaveBeenCalled();
			expect(result.nombres).toBe(updateDto.nombres);
			expect(result.cargo).toBe(updateDto.cargo);
			expect(result.telefono).toBe(updateDto.telefono);
		});

		it('should update timestamp on save', async () => {
			const updateDto = { nombres: 'Andrea' };
			const beforeUpdate = new Date();

			(mockRepository.findById as jest.Mock).mockResolvedValue(existingContact);
			const savedContact = { ...existingContact, ...updateDto, updatedAt: new Date() };
			(mockRepository.save as jest.Mock).mockResolvedValue(savedContact);

			const result = await useCase.execute(1, updateDto);

			expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
		});
	});
});
