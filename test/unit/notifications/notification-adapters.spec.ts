import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ActivityCompletionAdapter } from '@/modules/notifications/infrastructure/activities/activity-completion.adapter';
import { NotificationMailerAdapter } from '@/modules/notifications/infrastructure/mail/notification-mailer.adapter';

describe('Notifications adapters', () => {
    describe('ActivityCompletionAdapter', () => {
        let completeActivityFollowUp: any;
        let cancelActivityNotifications: any;
        let adapter: ActivityCompletionAdapter;

        beforeEach(() => {
            completeActivityFollowUp = { execute: jest.fn() };
            cancelActivityNotifications = { execute: jest.fn() };
            adapter = new ActivityCompletionAdapter(
                completeActivityFollowUp,
                cancelActivityNotifications,
            );
        });

        it('delegates activity completion to the use case', async () => {
            await adapter.onActivityCompleted(123);

            expect(completeActivityFollowUp.execute).toHaveBeenCalledWith(123);
        });

        it('delegates activity deletion to the cancel-notifications use case', async () => {
            await adapter.onActivityDeleted(123);

            expect(cancelActivityNotifications.execute).toHaveBeenCalledWith(
                123,
            );
        });
    });

    describe('NotificationMailerAdapter', () => {
        let mailService: any;
        let adapter: NotificationMailerAdapter;

        beforeEach(() => {
            mailService = { sendGenericEmail: jest.fn() };
            adapter = new NotificationMailerAdapter(mailService);
        });

        it('delegates the email send to the mail service', async () => {
            const input = {
                to: 'user@test.com',
                subject: 'Hola',
                html: '<p>Body</p>',
            };

            await adapter.send(input);

            expect(mailService.sendGenericEmail).toHaveBeenCalledWith(input);
        });
    });
});
