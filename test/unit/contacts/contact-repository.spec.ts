import { describe, expect, it, beforeEach } from '@jest/globals';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { PrismaContactRepository } from '@/modules/contacts/infrastructure/persistence/prisma-contact.repository';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';
import { ContactMapper } from '@/modules/contacts/infrastructure/persistence/mappers/contact.mapper';

describe('Contacts module', () => {
	/**
	 * PrismaContactRepository
	 * ----------
	 * Responsable de:
	 * - persistir contactos en la base de datos
	 * - buscar contactos por ID, email y organización
	 * - mapear entre entidades de dominio y modelos Prisma
	 * - manejar operaciones create/update
	 */
	// STATUS: Implementación completa (CRUD operations).
	describe('PrismaContactRepository', () => {
		let repository: PrismaContactRepository;
		let mockPrisma: Partial<PrismaService>;

		const mockContactData = {
			id: 1,
			nombres: 'Ana',
			apellidos: 'Paredes',
			vocativo: 'DOCTORA' as const,
			cargo: 'Gerente Comercial',
			correo: 'ana@techcorp.com',
			telefono: '+51987654321',
			correo2: 'ana.p@personal.com',
			comentarios: 'Contacto de prueba',
			idOrganizacion: 'org-1',
			idAuthor: 1,
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
			estado_correo: 'VIGENTE' as const,
		};

		beforeEach(() => {
			mockPrisma = {
				contacto: {
					create: jest.fn(),
					update: jest.fn(),
					findUnique: jest.fn(),
					findFirst: jest.fn(),
					findMany: jest.fn(),
				},
			};

			repository = new PrismaContactRepository(mockPrisma as any);
		});

		describe('save', () => {
			it('should create new contact when ID is 0', async () => {
				const contact = new Contact(
					0,
					'Ana',
					'Paredes',
					Vocative.DOCTORA,
					'Gerente Comercial',
					'ana@techcorp.com',
					'+51987654321',
					'ana.p@personal.com',
					'Contacto de prueba',
					'org-1',
					1,
					new Date('2024-01-01'),
					new Date('2024-01-01'),
					EstadoCorreo.VIGENTE,
				);

				(mockPrisma.contacto!.create as jest.Mock).mockResolvedValue(mockContactData);

				const result = await repository.save(contact);

				expect(mockPrisma.contacto!.create).toHaveBeenCalled();
				expect(result.id).toBe(1);
				expect(result.correo).toBe('ana@techcorp.com');
			});

			it('should update existing contact when ID is provided', async () => {
				const contact = new Contact(
					1,
					'Ana',
					'Paredes',
					Vocative.DOCTORA,
					'Gerente Comercial',
					'ana@techcorp.com',
					'+51987654321',
					'ana.p@personal.com',
					'Updated comment',
					'org-1',
					1,
					new Date('2024-01-01'),
					new Date('2024-01-02'),
					EstadoCorreo.VIGENTE,
				);

				(mockPrisma.contacto!.update as jest.Mock).mockResolvedValue(mockContactData);

				const result = await repository.save(contact);

				expect(mockPrisma.contacto!.update).toHaveBeenCalledWith(
					expect.objectContaining({
						where: { id: 1 },
					}),
				);
				expect(result.id).toBe(1);
			});
		});

		describe('findById', () => {
			it('should return contact when found', async () => {
				(mockPrisma.contacto!.findUnique as jest.Mock).mockResolvedValue(mockContactData);

				const result = await repository.findById(1);

				expect(mockPrisma.contacto!.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
				expect(result).not.toBeNull();
				expect(result!.id).toBe(1);
				expect(result!.correo).toBe('ana@techcorp.com');
			});

			it('should return null when contact not found', async () => {
				(mockPrisma.contacto!.findUnique as jest.Mock).mockResolvedValue(null);

				const result = await repository.findById(999);

				expect(result).toBeNull();
			});
		});

		describe('findByEmail', () => {
			it('should return contact when email found', async () => {
				(mockPrisma.contacto!.findFirst as jest.Mock).mockResolvedValue(mockContactData);

				const result = await repository.findByEmail('ana@techcorp.com');

				expect(mockPrisma.contacto!.findFirst).toHaveBeenCalledWith({
					where: { correo: 'ana@techcorp.com' },
				});
				expect(result).not.toBeNull();
				expect(result!.correo).toBe('ana@techcorp.com');
			});

			it('should return null when email not found', async () => {
				(mockPrisma.contacto!.findFirst as jest.Mock).mockResolvedValue(null);

				const result = await repository.findByEmail('nonexistent@example.com');

				expect(result).toBeNull();
			});
		});

		describe('findByOrganizationId', () => {
			it('should return contacts for organization', async () => {
				const contacts = [mockContactData, { ...mockContactData, id: 2, nombres: 'Juan' }];
				(mockPrisma.contacto!.findMany as jest.Mock).mockResolvedValue(contacts);

				const result = await repository.findByOrganizationId('org-1');

				expect(mockPrisma.contacto!.findMany).toHaveBeenCalledWith({
					where: { idOrganizacion: 'org-1' },
				});
				expect(result).toHaveLength(2);
				expect(result[0].correo).toBe('ana@techcorp.com');
			});

			it('should return empty array when no contacts found', async () => {
				(mockPrisma.contacto!.findMany as jest.Mock).mockResolvedValue([]);

				const result = await repository.findByOrganizationId('org-nonexistent');

				expect(result).toHaveLength(0);
			});
		});

		describe('findAll', () => {
			it('should return all contacts', async () => {
				const contacts = [mockContactData, { ...mockContactData, id: 2 }];
				(mockPrisma.contacto!.findMany as jest.Mock).mockResolvedValue(contacts);

				const result = await repository.findAll();

				expect(mockPrisma.contacto!.findMany).toHaveBeenCalled();
				expect(result).toHaveLength(2);
			});

			it('should return empty array when no contacts exist', async () => {
				(mockPrisma.contacto!.findMany as jest.Mock).mockResolvedValue([]);

				const result = await repository.findAll();

				expect(result).toHaveLength(0);
			});
		});

		describe('findBySecondaryEmail', () => {
			it('should return contact when secondary email found', async () => {
				(mockPrisma.contacto!.findFirst as jest.Mock).mockResolvedValue(mockContactData);

				const result = await repository.findBySecondaryEmail('ana.p@personal.com');

				expect(mockPrisma.contacto!.findFirst).toHaveBeenCalledWith({
					where: { correo2: 'ana.p@personal.com' },
				});
				expect(result).not.toBeNull();
				expect(result!.correo).toBe('ana@techcorp.com');
			});

			it('should return null when secondary email not found', async () => {
				(mockPrisma.contacto!.findFirst as jest.Mock).mockResolvedValue(null);

				const result = await repository.findBySecondaryEmail('unknown@test.com');

				expect(result).toBeNull();
			});
		});

		describe('findAllWithOrganization', () => {
			it('should return all contacts with organization names', async () => {
				const records = [
					{ ...mockContactData, organizacion: { nombre: 'Org A' } },
					{ ...mockContactData, id: 2, nombres: 'Juan', organizacion: { nombre: 'Org B' } },
				];
				(mockPrisma.contacto!.findMany as jest.Mock).mockResolvedValue(records);

				const result = await repository.findAllWithOrganization();

				expect(mockPrisma.contacto!.findMany).toHaveBeenCalledWith({
					include: { organizacion: { select: { nombre: true } } },
				});
				expect(result).toHaveLength(2);
				expect(result[0].organizationName).toBe('Org A');
				expect(result[0].contact.correo).toBe('ana@techcorp.com');
			});

			it('should return empty array when no contacts exist', async () => {
				(mockPrisma.contacto!.findMany as jest.Mock).mockResolvedValue([]);

				const result = await repository.findAllWithOrganization();

				expect(result).toHaveLength(0);
			});
		});

		describe('findByIdWithOrganization', () => {
			it('should return contact with organization name when found', async () => {
				const record = { ...mockContactData, organizacion: { nombre: 'Org A' } };
				(mockPrisma.contacto!.findUnique as jest.Mock).mockResolvedValue(record);

				const result = await repository.findByIdWithOrganization(1);

				expect(mockPrisma.contacto!.findUnique).toHaveBeenCalledWith({
					where: { id: 1 },
					include: { organizacion: { select: { nombre: true } } },
				});
				expect(result).not.toBeNull();
				expect(result!.organizationName).toBe('Org A');
			});

			it('should return null when contact not found', async () => {
				(mockPrisma.contacto!.findUnique as jest.Mock).mockResolvedValue(null);

				const result = await repository.findByIdWithOrganization(999);

				expect(result).toBeNull();
			});
		});

		describe('findByOrganizationIdWithOrganization', () => {
			it('should return contacts with organization names', async () => {
				const records = [
					{ ...mockContactData, organizacion: { nombre: 'Org A' } },
				];
				(mockPrisma.contacto!.findMany as jest.Mock).mockResolvedValue(records);

				const result = await repository.findByOrganizationIdWithOrganization('org-1');

				expect(mockPrisma.contacto!.findMany).toHaveBeenCalledWith({
					where: { idOrganizacion: 'org-1' },
					include: { organizacion: { select: { nombre: true } } },
				});
				expect(result).toHaveLength(1);
				expect(result[0].organizationName).toBe('Org A');
			});

			it('should return empty array when no contacts found', async () => {
				(mockPrisma.contacto!.findMany as jest.Mock).mockResolvedValue([]);

				const result = await repository.findByOrganizationIdWithOrganization('org-empty');

				expect(result).toHaveLength(0);
			});
		});
	});
});
