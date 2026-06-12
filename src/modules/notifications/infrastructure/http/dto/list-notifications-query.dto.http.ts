import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';

export class ListNotificationsQueryDto {
    @ApiPropertyOptional({
        enum: [NotificationStatus.PROGRAMADA, NotificationStatus.VENCIDA],
        description: 'Sección a consultar (Programadas o Vencidas)',
    })
    @IsOptional()
    @IsIn([NotificationStatus.PROGRAMADA, NotificationStatus.VENCIDA])
    estado?: NotificationStatus;

    @ApiPropertyOptional({ example: 1, description: 'Filtrar por lead' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idLead?: number;

    @ApiPropertyOptional({ example: 3, description: 'Filtrar por responsable' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idResponsable?: number;
}
