import {
    SeguimientoInstancia as PrismaSeguimientoInstancia,
    Prisma,
} from '@prisma/client';
import { FollowUpInstance } from '@/modules/notifications/domain/entities/follow-up-instance';

export class FollowUpInstanceMapper {
    static toDomain(record: PrismaSeguimientoInstancia): FollowUpInstance {
        return new FollowUpInstance(
            record.id,
            record.orden,
            record.asuntoInterno,
            record.cuerpoInterno,
            record.fechaEnvioInterno,
            record.idTemplateInterno,
            record.jobIdInterno,
            record.enviadoInterno,
            record.asuntoExterno,
            record.cuerpoExterno,
            record.fechaEnvioExterno,
            record.idTemplateExterno,
            record.jobIdExterno,
            record.enviadoExterno,
        );
    }

    /** Datos de creación sin `idNotificacion` (lo aporta el write anidado del padre). */
    static toCreateData(
        instancia: FollowUpInstance,
    ): Prisma.SeguimientoInstanciaCreateWithoutNotificacionInput {
        return {
            orden: instancia.orden,
            asuntoInterno: instancia.asunto_interno,
            cuerpoInterno: instancia.cuerpo_interno,
            fechaEnvioInterno: instancia.fecha_envio_interno,
            idTemplateInterno: instancia.id_template_interno,
            jobIdInterno: instancia.job_id_interno,
            enviadoInterno: instancia.enviado_interno,
            asuntoExterno: instancia.asunto_externo,
            cuerpoExterno: instancia.cuerpo_externo,
            fechaEnvioExterno: instancia.fecha_envio_externo,
            idTemplateExterno: instancia.id_template_externo,
            jobIdExterno: instancia.job_id_externo,
            enviadoExterno: instancia.enviado_externo,
        };
    }

    static toUpdateData(
        instancia: FollowUpInstance,
    ): Prisma.SeguimientoInstanciaUncheckedUpdateInput {
        return {
            orden: instancia.orden,
            asuntoInterno: instancia.asunto_interno,
            cuerpoInterno: instancia.cuerpo_interno,
            fechaEnvioInterno: instancia.fecha_envio_interno,
            idTemplateInterno: instancia.id_template_interno,
            jobIdInterno: instancia.job_id_interno,
            enviadoInterno: instancia.enviado_interno,
            asuntoExterno: instancia.asunto_externo,
            cuerpoExterno: instancia.cuerpo_externo,
            fechaEnvioExterno: instancia.fecha_envio_externo,
            idTemplateExterno: instancia.id_template_externo,
            jobIdExterno: instancia.job_id_externo,
            enviadoExterno: instancia.enviado_externo,
        };
    }
}
