import { describe, expect, it } from '@jest/globals';
import { ContactMapper } from '@/modules/contacts/infrastructure/persistence/mappers/contact.mapper';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';

describe('Contacts module', () => {
	describe('ContactMapper', () => {
		const mockPrismaContact = {
			id: 1,
			nombres: 'Ana',
			apellidos: 'Paredes',
			vocativo: Vocative.SRA,
			cargo: 'Gerente Comercial',
			correo: 'ana@techcorp.com',
			telefono: '+51987654321',
			correo2: 'ana.p@personal.com',
			comentarios: 'Contacto de prueba',
			idOrganizacion: 'org-1',
			idAuthor: 1,
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
			estado_correo: EstadoCorreo.VIGENTE,
		};

		describe('toDomain', () => {
			it('should convert Prisma model to domain entity', () => {
				const result = ContactMapper.toDomain(mockPrismaContact);

				expect(result).toBeInstanceOf(Contact);
				expect(result.id).toBe(1);
				expect(result.nombres).toBe('Ana');
				expect(result.apellidos).toBe('Paredes');
				expect(result.correo).toBe('ana@techcorp.com');
			});

			it('should preserve all properties during conversion', () => {
				const result = ContactMapper.toDomain(mockPrismaContact);

				expect(result.vocativo).toBe(Vocative.SRA);
				expect(result.comentarios).toBe('Contacto de prueba');
				expect(result.idOrganizacion).toBe('org-1');
				expect(result.idAuthor).toBe(1);
				expect(result.estado_correo).toBe(EstadoCorreo.VIGENTE);
			});

			it('should preserve dates', () => {
				const result = ContactMapper.toDomain(mockPrismaContact);

				expect(result.createdAt).toEqual(mockPrismaContact.createdAt);
				expect(result.updatedAt).toEqual(mockPrismaContact.updatedAt);
			});

			it('should handle null vocativo', () => {
				const contactWithNullVocativo = { ...mockPrismaContact, vocativo: null };
				const result = ContactMapper.toDomain(contactWithNullVocativo as any);

				expect(result.vocativo).toBeNull();
			});
		});

		describe('toPersistence', () => {
			it('should convert domain entity to Prisma format', () => {
				const domainContact = new Contact(
					1,
					'Ana',
					'Paredes',
					Vocative.SRA,
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

				const result = ContactMapper.toPersistence(domainContact);

				expect(result.nombres).toBe('Ana');
				expect(result.apellidos).toBe('Paredes');
				expect(result.correo).toBe('ana@techcorp.com');
				expect(result.vocativo).toBe(Vocative.SRA);
			});

			it('should exclude id, createdAt, updatedAt from persistence', () => {
				const domainContact = new Contact(
					1,
					'Ana',
					'Paredes',
					Vocative.SRA,
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

				const result = ContactMapper.toPersistence(domainContact);

				expect(result).not.toHaveProperty('id');
				expect(result).not.toHaveProperty('createdAt');
				expect(result).not.toHaveProperty('updatedAt');
			});

			it('should preserve all properties during round-trip conversion', () => {
				const original = new Contact(
					1,
					'Ana',
					'Paredes',
					Vocative.SRA,
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

				const toPersistence = ContactMapper.toPersistence(original);
				const reconstructed = ContactMapper.toDomain({
					...toPersistence,
					id: original.id,
					createdAt: original.createdAt,
					updatedAt: original.updatedAt,
				} as any);

				expect(reconstructed.nombres).toBe(original.nombres);
				expect(reconstructed.correo).toBe(original.correo);
				expect(reconstructed.vocativo).toBe(original.vocativo);
			});
		});
	});
});
