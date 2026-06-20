import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/get-email-template.use-case';
import { ListEmailTemplatesUseCase } from '@/modules/notifications/application/use-cases/list-email-templates.use-case';
import { ListActiveTemplatesUseCase } from '@/modules/notifications/application/use-cases/list-active-templates.use-case';
import { ListInAppNotificationsUseCase } from '@/modules/notifications/application/use-cases/list-in-app-notifications.use-case';
import { ListNotificationsUseCase } from '@/modules/notifications/application/use-cases/list-notifications.use-case';
import { EmailTemplateNotFoundException } from '@/modules/notifications/domain/exceptions/email-template-not-found.exception';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';

describe('Notifications use cases', () => {
    describe('GetEmailTemplateUseCase', () => {
        let repo: any;
        let useCase: GetEmailTemplateUseCase;

        beforeEach(() => {
            repo = { findById: jest.fn() };
            useCase = new GetEmailTemplateUseCase(repo);
        });

        it('returns the template when found', async () => {
            const template = { id: 1 };
            repo.findById.mockResolvedValue(template);

            const result = await useCase.execute(1);

            expect(repo.findById).toHaveBeenCalledWith(1);
            expect(result).toBe(template);
        });

        it('throws when the template is not found', async () => {
            repo.findById.mockResolvedValue(null);

            await expect(useCase.execute(99)).rejects.toBeInstanceOf(
                EmailTemplateNotFoundException,
            );
        });
    });

    describe('ListEmailTemplatesUseCase', () => {
        let repo: any;
        let useCase: ListEmailTemplatesUseCase;

        beforeEach(() => {
            repo = { list: jest.fn() };
            useCase = new ListEmailTemplatesUseCase(repo);
        });

        it('lists templates excluding inactive by default', async () => {
            const list = [{ id: 1 }];
            repo.list.mockResolvedValue(list);

            const result = await useCase.execute();

            expect(repo.list).toHaveBeenCalledWith(false);
            expect(result).toBe(list);
        });

        it('lists templates including inactive when requested', async () => {
            repo.list.mockResolvedValue([]);

            await useCase.execute(true);

            expect(repo.list).toHaveBeenCalledWith(true);
        });
    });

    describe('ListActiveTemplatesUseCase', () => {
        it('delegates to the template reader', async () => {
            const reader = { listActive: jest.fn() };
            const list = [{ id: 2 }];
            reader.listActive.mockResolvedValue(list);
            const useCase = new ListActiveTemplatesUseCase(reader as any);

            const result = await useCase.execute();

            expect(reader.listActive).toHaveBeenCalledTimes(1);
            expect(result).toBe(list);
        });
    });

    describe('ListInAppNotificationsUseCase', () => {
        it('delegates to the repository by user', async () => {
            const repo = { listByUser: jest.fn() };
            const list = [{ id: 1 }];
            repo.listByUser.mockResolvedValue(list);
            const useCase = new ListInAppNotificationsUseCase(repo as any);

            const result = await useCase.execute(55);

            expect(repo.listByUser).toHaveBeenCalledWith(55);
            expect(result).toBe(list);
        });
    });

    describe('ListNotificationsUseCase', () => {
        it('maps the query fields to the repository filter and returns data + total', async () => {
            const repo = { list: jest.fn(), count: jest.fn() };
            const list = [{ id: 1 }];
            repo.list.mockResolvedValue(list);
            repo.count.mockResolvedValue(7);
            const useCase = new ListNotificationsUseCase(repo as any);

            const result = await useCase.execute({
                estado: NotificationStatus.PROGRAMADA,
                idLead: 2,
                idResponsable: 3,
                page: 2,
                limit: 5,
            });

            expect(repo.list).toHaveBeenCalledWith({
                estado: NotificationStatus.PROGRAMADA,
                idLead: 2,
                idResponsable: 3,
                page: 2,
                limit: 5,
            });
            expect(repo.count).toHaveBeenCalledWith({
                estado: NotificationStatus.PROGRAMADA,
                idLead: 2,
                idResponsable: 3,
            });
            expect(result).toEqual({ data: list, total: 7 });
        });

        it('defaults to page 1 and limit 10 when not provided', async () => {
            const repo = { list: jest.fn(), count: jest.fn() };
            repo.list.mockResolvedValue([]);
            repo.count.mockResolvedValue(0);
            const useCase = new ListNotificationsUseCase(repo as any);

            await useCase.execute({});

            expect(repo.list).toHaveBeenCalledWith({
                estado: undefined,
                idLead: undefined,
                idResponsable: undefined,
                page: 1,
                limit: 10,
            });
        });
    });
});
