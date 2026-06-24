import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateFollowUpUseCase } from '@/modules/notifications/application/use-cases/create-follow-up.use-case';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';
import { ClientEmailRequiredException } from '@/modules/notifications/domain/exceptions/client-email-required.exception';
import { InvalidScheduleDateException } from '@/modules/notifications/domain/exceptions/invalid-schedule-date.exception';
import { LeadHasNoActiveActivityException } from '@/modules/notifications/domain/exceptions/lead-has-no-active-activity.exception';

describe('Notifications module', () => {
    describe('CreateFollowUpUseCase', () => {
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

        it('creates a follow-up and schedules each instance', async () => {
            const result = await useCase.execute(command());

            expect(result.tipo).toBe(NotificationType.SEGUIMIENTO);
            expect(result.correo_cliente).toBe('cliente@empresa.com');
            expect(result.instancias).toHaveLength(1);
            expect(scheduler.scheduleInstanceInternal).toHaveBeenCalled();
            expect(scheduler.scheduleInstanceExternal).toHaveBeenCalled();
            expect(result.instancias[0].job_id_interno).toBe(
                'seg-internal-100',
            );
            expect(result.instancias[0].job_id_externo).toBe(
                'seg-external-100',
            );
        });

        it('rejects a client email not associated to the lead', async () => {
            const cmd = command();
            cmd.correoCliente = 'otro@externo.com';
            await expect(useCase.execute(cmd)).rejects.toThrow(
                ClientEmailRequiredException,
            );
        });

        it('rejects when external email is not after internal', async () => {
            const cmd = { ...command(), instancias: [instance(14, 14)] };
            await expect(useCase.execute(cmd)).rejects.toThrow(
                InvalidScheduleDateException,
            );
        });

        it('rejects more than one instance', async () => {
            const cmd = {
                ...command(),
                instancias: [instance(10, 11), instance(12, 13)],
            };
            await expect(useCase.execute(cmd)).rejects.toThrow(
                InvalidScheduleDateException,
            );
        });

        it('throws when the lead has no active activity', async () => {
            contextReader.getActiveActivityByLead.mockResolvedValue(null);
            await expect(useCase.execute(command())).rejects.toThrow(
                LeadHasNoActiveActivityException,
            );
        });

        it('creates a follow-up without templates (manual subject/body)', async () => {
            const cmd = command();
            cmd.instancias[0].internal.idTemplate = null;
            cmd.instancias[0].external.idTemplate = null;

            const result = await useCase.execute(cmd);

            expect(result.tipo).toBe(NotificationType.SEGUIMIENTO);
            expect(result.instancias[0].id_template_interno).toBeNull();
            expect(result.instancias[0].id_template_externo).toBeNull();
            expect(templateReader.findActiveById).not.toHaveBeenCalled();
        });
    });
});
