import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { SendInternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-internal-email.use-case';
import { SendInstanceInternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-instance-internal-email.use-case';
import { SendInstanceExternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-instance-external-email.use-case';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { FollowUpInstance } from '@/modules/notifications/domain/entities/follow-up-instance';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';

const makeReminder = (overrides: Partial<ScheduledNotification> = {}) => {
    const n = ScheduledNotification.createReminder({
        idActividad: 1,
        idLead: 2,
        idResponsable: 3,
        internal: {
            asunto: 'Asunto interno',
            cuerpo: '<p>Cuerpo</p>',
            fechaEnvio: new Date('2099-01-01T00:00:00.000Z'),
            idTemplate: null,
        },
    });
    (n as any).id = 10;
    Object.assign(n, overrides);
    return n;
};

const makeFollowUp = (overrides: Partial<ScheduledNotification> = {}) => {
    const n = ScheduledNotification.createFollowUp({
        idActividad: 1,
        idLead: 2,
        idResponsable: 3,
        correoCliente: 'cliente@empresa.com',
        instancias: [
            {
                internal: {
                    asunto: 'Asunto interno',
                    cuerpo: '<p>Interno</p>',
                    fechaEnvio: new Date('2099-01-01T00:00:00.000Z'),
                    idTemplate: null,
                },
                external: {
                    asunto: 'Asunto externo',
                    cuerpo: '<p>Externo</p>',
                    fechaEnvio: new Date('2099-01-02T00:00:00.000Z'),
                    idTemplate: null,
                },
            },
        ],
    });
    (n as any).id = 20;
    (n.instancias[0] as any).id = 100;
    Object.assign(n, overrides);
    return n;
};

describe('Notifications send-email use cases', () => {
    describe('SendInternalEmailUseCase', () => {
        let repo: any;
        let mailer: any;
        let reader: any;
        let useCase: SendInternalEmailUseCase;

        beforeEach(() => {
            repo = { findById: jest.fn(), save: jest.fn() };
            mailer = { send: jest.fn() };
            reader = { getUserEmail: jest.fn() };
            useCase = new SendInternalEmailUseCase(repo, mailer, reader);
        });

        it('sends the internal email and persists the notification', async () => {
            const notification = makeReminder();
            repo.findById.mockResolvedValue(notification);
            reader.getUserEmail.mockResolvedValue('resp@test.com');

            await useCase.execute(10);

            expect(mailer.send).toHaveBeenCalledWith({
                to: 'resp@test.com',
                subject: 'Asunto interno',
                html: expect.stringContaining('Ver actividad del lead'),
            });
            expect(notification.enviado_interno).toBe(true);
            expect(notification.estado).toBe(NotificationStatus.VENCIDA);
            expect(repo.save).toHaveBeenCalledWith(notification);
        });

        it('returns early when the notification does not exist', async () => {
            repo.findById.mockResolvedValue(null);

            await useCase.execute(1);

            expect(mailer.send).not.toHaveBeenCalled();
        });

        it('returns early when the notification is not PROGRAMADA', async () => {
            repo.findById.mockResolvedValue(
                makeReminder({ estado: NotificationStatus.CANCELADA }),
            );

            await useCase.execute(10);

            expect(mailer.send).not.toHaveBeenCalled();
        });

        it('returns early when the internal email was already sent', async () => {
            repo.findById.mockResolvedValue(
                makeReminder({ enviado_interno: true }),
            );

            await useCase.execute(10);

            expect(mailer.send).not.toHaveBeenCalled();
        });

        it('warns and returns when internal content is missing', async () => {
            const notification = makeReminder({ asunto_interno: null });
            repo.findById.mockResolvedValue(notification);
            const warn = jest
                .spyOn((useCase as any).logger, 'warn')
                .mockImplementation(() => undefined);

            await useCase.execute(10);

            expect(warn).toHaveBeenCalled();
            expect(mailer.send).not.toHaveBeenCalled();
        });

        it('warns and returns when the responsible has no email', async () => {
            repo.findById.mockResolvedValue(makeReminder());
            reader.getUserEmail.mockResolvedValue(null);
            const warn = jest
                .spyOn((useCase as any).logger, 'warn')
                .mockImplementation(() => undefined);

            await useCase.execute(10);

            expect(warn).toHaveBeenCalled();
            expect(mailer.send).not.toHaveBeenCalled();
            expect(repo.save).not.toHaveBeenCalled();
        });
    });

    describe('SendInstanceInternalEmailUseCase', () => {
        let repo: any;
        let mailer: any;
        let reader: any;
        let useCase: SendInstanceInternalEmailUseCase;

        beforeEach(() => {
            repo = { findByInstanceId: jest.fn(), save: jest.fn() };
            mailer = { send: jest.fn() };
            reader = { getUserEmail: jest.fn() };
            useCase = new SendInstanceInternalEmailUseCase(repo, mailer, reader);
        });

        it('sends the instance internal email and persists', async () => {
            const notification = makeFollowUp();
            repo.findByInstanceId.mockResolvedValue(notification);
            reader.getUserEmail.mockResolvedValue('resp@test.com');

            await useCase.execute(100);

            expect(mailer.send).toHaveBeenCalledWith({
                to: 'resp@test.com',
                subject: 'Asunto interno',
                html: expect.stringContaining('Ver actividad del lead'),
            });
            expect(notification.instancias[0].enviado_interno).toBe(true);
            expect(repo.save).toHaveBeenCalledWith(notification);
        });

        it('returns early when the notification is missing', async () => {
            repo.findByInstanceId.mockResolvedValue(null);

            await useCase.execute(100);

            expect(mailer.send).not.toHaveBeenCalled();
        });

        it('returns early when the notification is not PROGRAMADA', async () => {
            repo.findByInstanceId.mockResolvedValue(
                makeFollowUp({ estado: NotificationStatus.VENCIDA }),
            );

            await useCase.execute(100);

            expect(mailer.send).not.toHaveBeenCalled();
        });

        it('returns early when the instance is not found', async () => {
            repo.findByInstanceId.mockResolvedValue(makeFollowUp());

            await useCase.execute(999);

            expect(mailer.send).not.toHaveBeenCalled();
        });

        it('returns early when the instance internal was already sent', async () => {
            const notification = makeFollowUp();
            notification.instancias[0].markInternalSent();
            repo.findByInstanceId.mockResolvedValue(notification);

            await useCase.execute(100);

            expect(mailer.send).not.toHaveBeenCalled();
        });

        it('warns and returns when the responsible has no email', async () => {
            repo.findByInstanceId.mockResolvedValue(makeFollowUp());
            reader.getUserEmail.mockResolvedValue(null);
            const warn = jest
                .spyOn((useCase as any).logger, 'warn')
                .mockImplementation(() => undefined);

            await useCase.execute(100);

            expect(warn).toHaveBeenCalled();
            expect(mailer.send).not.toHaveBeenCalled();
        });
    });

    describe('SendInstanceExternalEmailUseCase', () => {
        let repo: any;
        let mailer: any;
        let useCase: SendInstanceExternalEmailUseCase;

        beforeEach(() => {
            repo = { findByInstanceId: jest.fn(), save: jest.fn() };
            mailer = { send: jest.fn() };
            useCase = new SendInstanceExternalEmailUseCase(repo, mailer);
        });

        it('sends the external email, closes the follow-up and persists', async () => {
            const notification = makeFollowUp();
            // internal already sent so closeIfAllInstancesSent fires after external
            notification.instancias[0].markInternalSent();
            repo.findByInstanceId.mockResolvedValue(notification);

            await useCase.execute(100);

            expect(mailer.send).toHaveBeenCalledWith({
                to: 'cliente@empresa.com',
                subject: 'Asunto externo',
                html: '<p>Externo</p>',
            });
            expect(notification.instancias[0].enviado_externo).toBe(true);
            expect(notification.estado).toBe(NotificationStatus.VENCIDA);
            expect(repo.save).toHaveBeenCalledWith(notification);
        });

        it('sends the external email but stays PROGRAMADA when internal still pending', async () => {
            const notification = makeFollowUp();
            repo.findByInstanceId.mockResolvedValue(notification);

            await useCase.execute(100);

            expect(notification.instancias[0].enviado_externo).toBe(true);
            expect(notification.estado).toBe(NotificationStatus.PROGRAMADA);
            expect(repo.save).toHaveBeenCalledWith(notification);
        });

        it('returns early when the notification is missing', async () => {
            repo.findByInstanceId.mockResolvedValue(null);

            await useCase.execute(100);

            expect(mailer.send).not.toHaveBeenCalled();
        });

        it('returns early when the notification is not PROGRAMADA', async () => {
            repo.findByInstanceId.mockResolvedValue(
                makeFollowUp({ estado: NotificationStatus.CANCELADA }),
            );

            await useCase.execute(100);

            expect(mailer.send).not.toHaveBeenCalled();
        });

        it('returns early when the instance is not found', async () => {
            repo.findByInstanceId.mockResolvedValue(makeFollowUp());

            await useCase.execute(999);

            expect(mailer.send).not.toHaveBeenCalled();
        });

        it('returns early when the external was already sent', async () => {
            const notification = makeFollowUp();
            notification.instancias[0].markExternalSent();
            repo.findByInstanceId.mockResolvedValue(notification);

            await useCase.execute(100);

            expect(mailer.send).not.toHaveBeenCalled();
        });

        it('warns and returns when the client email is missing', async () => {
            repo.findByInstanceId.mockResolvedValue(
                makeFollowUp({ correo_cliente: null }),
            );
            const warn = jest
                .spyOn((useCase as any).logger, 'warn')
                .mockImplementation(() => undefined);

            await useCase.execute(100);

            expect(warn).toHaveBeenCalled();
            expect(mailer.send).not.toHaveBeenCalled();
        });
    });
});
