import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const ASSIGNABLE_ROLES = ['ADMINISTRADOR', 'TRABAJADOR'] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export class ChangeRoleDto {
    @ApiProperty({
        enum: ASSIGNABLE_ROLES,
        example: 'TRABAJADOR',
        description: 'Nuevo rol del usuario',
    })
    @IsIn(ASSIGNABLE_ROLES, {
        message: 'El rol debe ser ADMINISTRADOR o TRABAJADOR.',
    })
    rol: AssignableRole;
}
