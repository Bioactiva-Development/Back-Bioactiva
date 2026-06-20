import { describe, expect, it } from '@jest/globals';
import { EmailTemplateMapper } from '@/modules/notifications/infrastructure/persistance/mappers/email-template.mapper';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';

describe('Notifications module', () => {
    describe('EmailTemplateMapper', () => {
        const createdAt = new Date('2024-01-01T00:00:00Z');
        const updatedAt = new Date('2024-01-02T00:00:00Z');

        describe('toDomain', () => {
            it('should convert a Prisma record into the domain entity', () => {
                const record = {
                    id: 1,
                    nombre: 'Bienvenida',
                    asunto: 'Hola',
                    cuerpo: 'Cuerpo del correo',
                    activo: true,
                    createdAt,
                    updatedAt,
                };

                const result = EmailTemplateMapper.toDomain(record as any);

                expect(result).toBeInstanceOf(EmailTemplate);
                expect(result.id).toBe(1);
                expect(result.nombre).toBe('Bienvenida');
                expect(result.asunto).toBe('Hola');
                expect(result.cuerpo).toBe('Cuerpo del correo');
                expect(result.activo).toBe(true);
                expect(result.created_at).toEqual(createdAt);
                expect(result.updated_at).toEqual(updatedAt);
            });

            it('should preserve the inactive flag', () => {
                const record = {
                    id: 2,
                    nombre: 'Inactiva',
                    asunto: 'A',
                    cuerpo: 'C',
                    activo: false,
                    createdAt,
                    updatedAt,
                };

                const result = EmailTemplateMapper.toDomain(record as any);

                expect(result.activo).toBe(false);
            });
        });

        describe('toCreateData', () => {
            it('should map the domain entity to the Prisma create payload', () => {
                const template = new EmailTemplate(
                    null,
                    'Bienvenida',
                    'Hola',
                    'Cuerpo',
                    true,
                    createdAt,
                    updatedAt,
                );

                const result = EmailTemplateMapper.toCreateData(template);

                expect(result).toEqual({
                    nombre: 'Bienvenida',
                    asunto: 'Hola',
                    cuerpo: 'Cuerpo',
                    activo: true,
                });
            });
        });

        describe('toUpdateData', () => {
            it('should map the domain entity to the Prisma update payload', () => {
                const template = new EmailTemplate(
                    3,
                    'Editada',
                    'Asunto',
                    'Cuerpo',
                    false,
                    createdAt,
                    updatedAt,
                );

                const result = EmailTemplateMapper.toUpdateData(template);

                expect(result).toEqual({
                    nombre: 'Editada',
                    asunto: 'Asunto',
                    cuerpo: 'Cuerpo',
                    activo: false,
                });
            });
        });
    });
});
