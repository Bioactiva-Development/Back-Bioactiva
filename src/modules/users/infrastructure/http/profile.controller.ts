import {
    Body,
    Controller,
    Get,
    HttpCode,
    Patch,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { User } from '@/modules/users/domain/entities/user';
import { UpdateOwnProfileUseCase } from '@/modules/users/application/use-cases/update-own-profile.use-case';
import { ChangeOwnPasswordUseCase } from '@/modules/users/application/use-cases/change-own-password.use-case';
import { UpdateProfileDto } from '@/modules/users/infrastructure/http/dtos/update-profile.dto.http';
import { ChangePasswordDto } from '@/modules/users/infrastructure/http/dtos/change-password.dto.http';
import { UserResponseDto } from '@/modules/users/infrastructure/http/dtos/user-response.dto';

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
    constructor(
        private readonly updateOwnProfileUseCase: UpdateOwnProfileUseCase,
        private readonly changeOwnPasswordUseCase: ChangeOwnPasswordUseCase,
    ) {}

    @Get()
    @ApiOperation({
        summary: 'Obtener mi perfil',
        description: 'Devuelve los datos de la cuenta autenticada.',
    })
    @ApiResponse({ status: 200, type: UserResponseDto })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    getMyProfile(@CurrentUser() currentUser: User): UserResponseDto {
        return new UserResponseDto(currentUser);
    }

    @Patch()
    @ApiOperation({
        summary: 'Actualizar mi perfil',
        description:
            'Permite al usuario autenticado modificar sus nombres y/o apellidos. El correo no es modificable.',
    })
    @ApiResponse({ status: 200, type: UserResponseDto })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async updateMyProfile(
        @Body() body: UpdateProfileDto,
        @CurrentUser() currentUser: User,
    ): Promise<UserResponseDto> {
        const updated = await this.updateOwnProfileUseCase.execute(
            currentUser.id!,
            { nombres: body.nombres, apellidos: body.apellidos },
        );
        return new UserResponseDto(updated);
    }

    @Patch('password')
    @HttpCode(204)
    @ApiOperation({
        summary: 'Cambiar mi contraseña',
        description:
            'Permite al usuario autenticado cambiar su contraseña verificando la actual.',
    })
    @ApiResponse({ status: 204, description: 'Contraseña actualizada' })
    @ApiResponse({
        status: 400,
        description:
            'La contraseña actual no es correcta o la nueva es inválida',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async changeMyPassword(
        @Body() body: ChangePasswordDto,
        @CurrentUser() currentUser: User,
    ): Promise<void> {
        await this.changeOwnPasswordUseCase.execute(
            currentUser.id!,
            body.currentPassword,
            body.newPassword,
        );
    }
}
