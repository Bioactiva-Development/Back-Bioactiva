import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UpdateEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/update-email-template.use-case';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';
import { EmailTemplateNameTakenException } from '@/modules/notifications/domain/exceptions/email-template-name-taken.exception';

/**
 * Branch coverage extra para `if (other && other.id !== id)`:
 *  - other === null            -> no lanza.
 *  - other con el MISMO id     -> no lanza.
 *  - other con id DIFERENTE    -> lanza conflicto de nombre.
 */
describe('Notifications module — UpdateEmailTemplateUseCase branches2', () => {
    let useCase: UpdateEmailTemplateUseCase;
    let repository: any;

    const buildTemplate = (id: number, nombre: string) =>
        new EmailTemplate(
            id,
            nombre,
            'Asunto',
            'Cuerpo',
            true,
            new Date(),
            new Date(),
        );

    beforeEach(() => {
        repository = {
            findById: jest.fn(),
            findByName: jest.fn(),
            save: jest.fn(async (t: any) => t),
        };
        useCase = new UpdateEmailTemplateUseCase(repository);
    });

    it('updates when no other template has that name (other === null)', async () => {
        repository.findById.mockResolvedValue(buildTemplate(1, 'Original'));
        repository.findByName.mockResolvedValue(null);

        const result = await useCase.execute(1, { nombre: 'Nuevo' } as any);

        expect(result.nombre).toBe('Nuevo');
        expect(repository.save).toHaveBeenCalled();
    });

    it('updates when the name belongs to the same template (other.id === id)', async () => {
        repository.findById.mockResolvedValue(buildTemplate(1, 'Original'));
        repository.findByName.mockResolvedValue(buildTemplate(1, 'Nuevo'));

        const result = await useCase.execute(1, { nombre: 'Nuevo' } as any);

        expect(result.nombre).toBe('Nuevo');
        expect(repository.save).toHaveBeenCalled();
    });

    it('throws when the name belongs to a different template (other.id !== id)', async () => {
        repository.findById.mockResolvedValue(buildTemplate(1, 'Original'));
        repository.findByName.mockResolvedValue(buildTemplate(2, 'Nuevo'));

        await expect(
            useCase.execute(1, { nombre: 'Nuevo' } as any),
        ).rejects.toThrow(EmailTemplateNameTakenException);
        expect(repository.save).not.toHaveBeenCalled();
    });
});
