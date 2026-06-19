import { describe, expect, it } from '@jest/globals';
import { FollowUpInstanceMapper } from '@/modules/notifications/infrastructure/persistance/mappers/follow-up-instance.mapper';
import { FollowUpInstance } from '@/modules/notifications/domain/entities/follow-up-instance';

describe('Notifications module', () => {
    describe('FollowUpInstanceMapper', () => {
        const fechaInterno = new Date('2024-01-01T08:00:00Z');
        const fechaExterno = new Date('2024-01-02T08:00:00Z');

        const buildInstance = (overrides: Partial<FollowUpInstance> = {}) =>
            new FollowUpInstance(
                overrides.id ?? 1,
                overrides.orden ?? 1,
                overrides.asunto_interno ?? 'Asunto interno',
                overrides.cuerpo_interno ?? 'Cuerpo interno',
                overrides.fecha_envio_interno ?? fechaInterno,
                overrides.id_template_interno ?? 7,
                overrides.job_id_interno ?? 'job-int',
                overrides.enviado_interno ?? false,
                overrides.asunto_externo ?? 'Asunto externo',
                overrides.cuerpo_externo ?? 'Cuerpo externo',
                overrides.fecha_envio_externo ?? fechaExterno,
                overrides.id_template_externo ?? 8,
                overrides.job_id_externo ?? 'job-ext',
                overrides.enviado_externo ?? false,
            );

        describe('toDomain', () => {
            it('should convert a Prisma record into the domain entity', () => {
                const record = {
                    id: 1,
                    orden: 2,
                    asuntoInterno: 'Asunto interno',
                    cuerpoInterno: 'Cuerpo interno',
                    fechaEnvioInterno: fechaInterno,
                    idTemplateInterno: 7,
                    jobIdInterno: 'job-int',
                    enviadoInterno: true,
                    asuntoExterno: 'Asunto externo',
                    cuerpoExterno: 'Cuerpo externo',
                    fechaEnvioExterno: fechaExterno,
                    idTemplateExterno: 8,
                    jobIdExterno: 'job-ext',
                    enviadoExterno: false,
                };

                const result = FollowUpInstanceMapper.toDomain(record as any);

                expect(result).toBeInstanceOf(FollowUpInstance);
                expect(result.id).toBe(1);
                expect(result.orden).toBe(2);
                expect(result.asunto_interno).toBe('Asunto interno');
                expect(result.fecha_envio_interno).toEqual(fechaInterno);
                expect(result.id_template_interno).toBe(7);
                expect(result.job_id_interno).toBe('job-int');
                expect(result.enviado_interno).toBe(true);
                expect(result.id_template_externo).toBe(8);
                expect(result.enviado_externo).toBe(false);
            });

            it('should preserve null optional template ids and job ids', () => {
                const record = {
                    id: 2,
                    orden: 1,
                    asuntoInterno: 'A',
                    cuerpoInterno: 'C',
                    fechaEnvioInterno: fechaInterno,
                    idTemplateInterno: null,
                    jobIdInterno: null,
                    enviadoInterno: false,
                    asuntoExterno: 'AE',
                    cuerpoExterno: 'CE',
                    fechaEnvioExterno: fechaExterno,
                    idTemplateExterno: null,
                    jobIdExterno: null,
                    enviadoExterno: false,
                };

                const result = FollowUpInstanceMapper.toDomain(record as any);

                expect(result.id_template_interno).toBeNull();
                expect(result.job_id_interno).toBeNull();
                expect(result.id_template_externo).toBeNull();
                expect(result.job_id_externo).toBeNull();
            });
        });

        describe('toCreateData', () => {
            it('should map the domain entity to the create-without-notificacion payload', () => {
                const result = FollowUpInstanceMapper.toCreateData(
                    buildInstance(),
                );

                expect(result).toEqual({
                    orden: 1,
                    asuntoInterno: 'Asunto interno',
                    cuerpoInterno: 'Cuerpo interno',
                    fechaEnvioInterno: fechaInterno,
                    idTemplateInterno: 7,
                    jobIdInterno: 'job-int',
                    enviadoInterno: false,
                    asuntoExterno: 'Asunto externo',
                    cuerpoExterno: 'Cuerpo externo',
                    fechaEnvioExterno: fechaExterno,
                    idTemplateExterno: 8,
                    jobIdExterno: 'job-ext',
                    enviadoExterno: false,
                });
                expect(result).not.toHaveProperty('idNotificacion');
            });
        });

        describe('toUpdateData', () => {
            it('should map the domain entity to the unchecked update payload', () => {
                const result = FollowUpInstanceMapper.toUpdateData(
                    buildInstance({ enviado_interno: true }),
                );

                expect(result).toEqual({
                    orden: 1,
                    asuntoInterno: 'Asunto interno',
                    cuerpoInterno: 'Cuerpo interno',
                    fechaEnvioInterno: fechaInterno,
                    idTemplateInterno: 7,
                    jobIdInterno: 'job-int',
                    enviadoInterno: true,
                    asuntoExterno: 'Asunto externo',
                    cuerpoExterno: 'Cuerpo externo',
                    fechaEnvioExterno: fechaExterno,
                    idTemplateExterno: 8,
                    jobIdExterno: 'job-ext',
                    enviadoExterno: false,
                });
            });
        });
    });
});
