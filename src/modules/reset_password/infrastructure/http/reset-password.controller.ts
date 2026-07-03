import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
    RecaptchaGuard,
    RECAPTCHA_TOKEN_HEADER,
} from '@/modules/auth/infrastructure/http/guards/recaptcha.guard';
import { RecaptchaAction } from '@/modules/auth/infrastructure/http/decorator/recaptcha-action.decorator';
import { RequestPasswordResetUseCase } from '@/modules/reset_password/application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '@/modules/reset_password/application/use-cases/reset-password.use-case';
import { ValidateResetTokenUseCase } from '@/modules/reset_password/application/use-cases/validate-reset-token.use-case';
import { ObtainResetInfoUseCase } from '@/modules/reset_password/application/use-cases/obtain-reset-info.use-case';
import { RequestResetDto } from './dto/request-reset.dto.http';
import { ResetPasswordDto } from './dto/reset-password.dto.http';
import { ValidateTokenDto } from './dto/validate-token.dto.http';

@ApiTags('reset-password')
@Controller('reset-password')
export class ResetPasswordController {
    constructor(
        private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
        private readonly resetPasswordUseCase: ResetPasswordUseCase,
        private readonly validateResetTokenUseCase: ValidateResetTokenUseCase,
        private readonly obtainResetInfoUseCase: ObtainResetInfoUseCase,
    ) {}

    @Post('request')
    @HttpCode(HttpStatus.OK)
    @UseGuards(RecaptchaGuard)
    @RecaptchaAction('password_reset')
    @ApiOperation({
        summary: 'Solicitar el restablecimiento de contraseña',
        description:
            'Envía un correo con el enlace de recuperación si la cuenta existe y puede autenticarse. Por razones anti-enumeración siempre responde `{ ok: true }`, exista o no la cuenta.',
    })
    @ApiHeader({
        name: RECAPTCHA_TOKEN_HEADER,
        description:
            'Token de reCAPTCHA Enterprise generado por el frontend (action: password_reset)',
        required: true,
    })
    @ApiResponse({
        status: 200,
        description: 'Solicitud procesada (no confirma si el correo existe)',
        schema: { example: { ok: true } },
    })
    @ApiResponse({
        status: 400,
        description: 'Correo electrónico inválido',
    })
    @ApiResponse({
        status: 401,
        description: 'Token de reCAPTCHA ausente o inválido',
    })
    async requestReset(@Body() body: RequestResetDto) {
        return this.requestPasswordResetUseCase.execute(body.correo);
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Restablecer la contraseña con un token válido',
        description:
            'Consume el token de recuperación (de un solo uso) y actualiza la contraseña del usuario asociado.',
    })
    @ApiResponse({
        status: 200,
        description: 'Contraseña actualizada exitosamente',
        schema: { example: { ok: true } },
    })
    @ApiResponse({
        status: 400,
        description:
            'Las contraseñas no coinciden, la contraseña no cumple la política de seguridad, o el token es inválido/expirado/ya usado',
    })
    async resetPassword(@Body() body: ResetPasswordDto) {
        if (body.password !== body.confirmPassword) {
            throw new BadRequestException('Las contraseñas no coinciden');
        }

        return this.resetPasswordUseCase.execute(body.token, body.password);
    }

    @Post('validate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Validar un token de recuperación',
        description:
            'Verifica que el token exista, no esté expirado y no haya sido usado. Devuelve el correo enmascarado del titular.',
    })
    @ApiResponse({
        status: 200,
        description: 'Token válido',
        schema: { example: { correo: 'j***n@bioactiva.com' } },
    })
    @ApiResponse({
        status: 400,
        description: 'Token inválido, expirado o ya utilizado',
    })
    async validateToken(@Body() body: ValidateTokenDto) {
        return this.validateResetTokenUseCase.execute(body.token);
    }

    @Get('info/:token')
    @ApiOperation({
        summary: 'Obtener información pública de un token de recuperación',
        description:
            'A diferencia de /validate, no lanza error si el token está expirado o usado: devuelve esos estados en el body para que el frontend los muestre antes de renderizar el formulario.',
    })
    @ApiResponse({
        status: 200,
        description: 'Información del token de recuperación',
        schema: {
            example: {
                correo: 'j***n@bioactiva.com',
                expired: false,
                used: false,
            },
        },
    })
    @ApiResponse({ status: 404, description: 'Token no encontrado' })
    async obtainInfo(@Param('token') token: string) {
        return this.obtainResetInfoUseCase.execute(token);
    }
}
