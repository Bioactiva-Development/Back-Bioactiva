import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MarkInAppNotificationReadUseCase } from '@/modules/notifications/application/use-cases/mark-in-app-notification-read.use-case';
import { InAppNotification } from '@/modules/notifications/domain/entities/in-app-notification';
import { InAppNotificationStatus } from '@/modules/notifications/domain/enums/in-app-notification-status';
import { InAppNotificationNotFoundException } from '@/modules/notifications/domain/exceptions/in-app-notification-not-found.exception';

describe('Notifications module', () => {
    describe('MarkInAppNotificationReadUseCase', () => {
        let useCase: MarkInAppNotificationReadUseCase;
        let repository: any;

        const buildNotification = (idUsuario = 10) =>
            new InAppNotification(
                5,
                'Lead sin avance',
                'mensaje',
                InAppNotificationStatus.NO_LEIDA,
                idUsuario,
                null,
                1,
                new Date(),
            );

        beforeEach(() => {
            repository = {
                findById: jest.fn(),
                save: jest.fn(async (n: any) => n),
            };
            useCase = new MarkInAppNotificationReadUseCase(repository);
        });

        it('marks the notification as read for its owner', async () => {
            repository.findById.mockResolvedValue(buildNotification(10));

            const result = await useCase.execute(5, 10);

            expect(result.estado).toBe(InAppNotificationStatus.LEIDA);
            expect(repository.save).toHaveBeenCalled();
        });

        it('throws when the notification belongs to another user', async () => {
            repository.findById.mockResolvedValue(buildNotification(99));

            await expect(useCase.execute(5, 10)).rejects.toThrow(
                InAppNotificationNotFoundException,
            );
            expect(repository.save).not.toHaveBeenCalled();
        });

        it('throws when the notification does not exist', async () => {
            repository.findById.mockResolvedValue(null);

            await expect(useCase.execute(5, 10)).rejects.toThrow(
                InAppNotificationNotFoundException,
            );
        });
    });
});
