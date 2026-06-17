import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { SendInternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-internal-email.use-case';
import { SendInstanceInternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-instance-internal-email.use-case';
import { SendInstanceExternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-instance-external-email.use-case';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';

const buildReminder = () => {
    const n = ScheduledNotification.createReminder({
        idActividad: 1,
        idLead: 2,
        idResponsable: 3,
        internal: {
            asunto: 'Asunto interno',
            cuerpo: 'Cuerpo interno',
            fechaEnvio: new Date('2099-01-01T14:00:00.000Z'),
            idTemplate: 5,
        },
    });
    (n as any).id = 10;
    return n;
};

const buildFollowUp = () => {
    const n = ScheduledNotification.createFollowUp({
        idActividad: 1,
        idLead: 2,
        idResponsable: 3,
        correoCliente: 'cliente@empresa.com',
        instancias: [
            {
                internal: {
                    asunto: 'Asunto interno',
                    cuerpo: 'Cuerpo interno',
                    fechaEnvio: new Date('2099-01-01T14:00:00.000Z'),
                    idTemplate: 5,
                },
                external: {
                    asunto: 'Asunto externo',
                    cuerpo: 'Cuerpo externo',
                    fechaEnvio: new Date('2099-01-01T16:00:00.000Z'),
                    idTemplate: 6,
                },
            },
        ],
    });
    (n as any).id = 20;
    (n.instancias[0] as any).id = 100;
    return n;
};

describe('Notifications module', () => {
    describe('SendInternalEmailUseCase (recordatorio)', () => {
        let useCase: SendInternalEmailUseCase;
        let repository: any;
        let mailer: any;
        let contextReader: any;

        beforeEach(() => {
            repository = {
                findById: jest.fn(),
                save: jest.fn(async (n: any) => n),
            };
            mailer = { send: jest.fn() };
            contextReader = {
                getUserEmail: jest.fn().mockResolvedValue('resp@bioactiva.com'),
            };
            useCase = new SendInternalEmailUseCase(
                repository,
                mailer,
                contextReader,
            );
        });

        it('sends the internal email and marks it sent', async () => {
            repository.findById.mockResolvedValue(buildReminder());

            await useCase.execute(10);

            expect(mailer.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'resp@bioactiva.com',
                    subject: 'Asunto interno',
                }),
            );
            const saved = repository.save.mock.calls[0][0];
            expect(saved.enviado_interno).toBe(true);
        });

        it('does nothing when the notification was cancelled', async () => {
            const n = buildReminder();
            n.cancel();
            repository.findById.mockResolvedValue(n);

            await useCase.execute(10);

            expect(mailer.send).not.toHaveBeenCalled();
        });
    });

    describe('SendInstanceInternalEmailUseCase (seguimiento)', () => {
        let useCase: SendInstanceInternalEmailUseCase;
        let repository: any;
        let mailer: any;
        let contextReader: any;

        beforeEach(() => {
            repository = {
                findByInstanceId: jest.fn(),
                save: jest.fn(async (n: any) => n),
            };
            mailer = { send: jest.fn() };
            contextReader = {
                getUserEmail: jest.fn().mockResolvedValue('resp@bioactiva.com'),
            };
            useCase = new SendInstanceInternalEmailUseCase(
                repository,
                mailer,
                contextReader,
            );
        });

        it('sends the instance internal email to the responsible user', async () => {
            repository.findByInstanceId.mockResolvedValue(buildFollowUp());

            await useCase.execute(100);

            expect(mailer.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'resp@bioactiva.com',
                    subject: 'Asunto interno',
                }),
            );
            const saved = repository.save.mock.calls[0][0];
            expect(saved.instancias[0].enviado_interno).toBe(true);
        });
    });

    describe('SendInstanceExternalEmailUseCase (seguimiento)', () => {
        let useCase: SendInstanceExternalEmailUseCase;
        let repository: any;
        let mailer: any;

        beforeEach(() => {
            repository = {
                findByInstanceId: jest.fn(),
                save: jest.fn(async (n: any) => n),
            };
            mailer = { send: jest.fn() };
            useCase = new SendInstanceExternalEmailUseCase(repository, mailer);
        });

        it('sends the external email and closes the follow-up once every instance is sent', async () => {
            const n = buildFollowUp();
            n.instancias[0].markInternalSent();
            repository.findByInstanceId.mockResolvedValue(n);

            await useCase.execute(100);

            expect(mailer.send).toHaveBeenCalledWith({
                to: 'cliente@empresa.com',
                subject: 'Asunto externo',
                html: 'Cuerpo externo',
            });
            const saved = repository.save.mock.calls[0][0];
            expect(saved.estado).toBe(NotificationStatus.VENCIDA);
        });

        it('does not send when the follow-up was already completed', async () => {
            const n = buildFollowUp();
            n.completeFollowUp();
            repository.findByInstanceId.mockResolvedValue(n);

            await useCase.execute(100);

            expect(mailer.send).not.toHaveBeenCalled();
        });
    });
});
