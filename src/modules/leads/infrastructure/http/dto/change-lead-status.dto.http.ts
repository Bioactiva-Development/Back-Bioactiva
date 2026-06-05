import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';

export class HttpChangeLeadStatusDto {
    @ApiProperty({
        enum: LeadState,
        example: LeadState.OFERTADO,
        description: 'Nuevo estado del lead',
    })
    @IsEnum(LeadState)
    estado!: LeadState;
}
