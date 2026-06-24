import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateFollowUpUseCase } from '@/modules/notifications/application/use-cases/create-follow-up.use-case';
import { DuplicateNotificationException } from '@/modules/notifications/domain/exceptions/duplicate-notification.exception';
import { EmailTemplateNotFoundException } from '@/modules/notifications/domain/exceptions/email-template-not-found.exception';

describe('Notifications module', () => {
    describe('CreateFollowUpUseCase — branches', () => {
        let useCase: CreateFollowUpUseCase;
        let repository: any;
        let scheduler: any;
        let templateReader: any;
        let contextReader: any;

        const context = {
            idActividad: 1,
            idLead: 2,
            idResponsable: 3,
            responsableEmail: 'resp@bioactiva.com',
            fechaFin: new Date('2099-01-10T14:00:00.000Z'),
            estado: 'PENDIENTE',
            contactEmails: ['cliente@empresa.com'],
        };

        const instance = (internalHour: number, externalHour: number) => ({
            internal: {
                fechaEnvio: new Date(2099, 0, 1, internalHour, 0, 0),
                idTemplate: 5 as number | null,
                asunto: 'Interno',
                cuerpo: 'Cuerpo interno',
            },
            external: {
                fechaEnvio: new Date(2099, 0, 1, externalHour, 0, 0),
                idTemplate: 6 as number | null,
                asunto: 'Externo',
                cuerpo: 'Cuerpo externo',
            },
        });

        const command = () => ({
            idLead: 2,
            correoCliente: 'cliente@empresa.com',
            instancias: [instance(10, 11)],
        });

        beforeEach(() => {
            repository = {
                save: jest.fn(async (n: any) => {
                    if (n.id === null) {
                        n.id = 20;
                        n.instancias.forEach((inst: any, i: number) => {
                            if (inst.id === null) {
                                inst.id = 100 + i;
                            }
                        });
                    }
                    return n;
                }),
                findActiveByActivity: jest.fn().mockResolvedValue(null),
            };
            scheduler = {
                scheduleInstanceInternal: jest
                    .fn()
                    .mockResolvedValue('seg-internal-100'),
                scheduleInstanceExternal: jest
                    .fn()
                    .mockResolvedValue('seg-external-100'),
            };
            templateReader = {
                findActiveById: jest
                    .fn()
                    .mockResolvedValue({ id: 1, activo: true }),
            };
            contextReader = {
                getActiveActivityByLead: jest.fn().mockResolvedValue(context),
            };
            useCase = new CreateFollowUpUseCase(
                repository,
                scheduler,
                templateReader,
                contextReader,
            );
        });

        it('rejects when an active notification already exists for the activity', async () => {
            repository.findActiveByActivity.mockResolvedValue({ id: 99 });
            await expect(useCase.execute(command())).rejects.toThrow(
                DuplicateNotificationException,
            );
        });

        it('rejects when the chosen template does not exist or is inactive', async () => {
            templateReader.findActiveById.mockResolvedValue(null);
            await expect(useCase.execute(command())).rejects.toThrow(
                EmailTemplateNotFoundException,
            );
        });

        it('rejects when correoCliente is missing (falsy)', async () => {
            const cmd = { ...command(), correoCliente: '' };
            await expect(useCase.execute(cmd)).rejects.toThrow();
        });
    });
});
