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
import { ApiHeader } from '@nestjs/swagger';
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
    @ApiHeader({
        name: RECAPTCHA_TOKEN_HEADER,
        description:
            'Token de reCAPTCHA Enterprise generado por el frontend (action: password_reset)',
        required: true,
    })
    async requestReset(@Body() body: RequestResetDto) {
        return this.requestPasswordResetUseCase.execute(body.correo);
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() body: ResetPasswordDto) {
        if (body.password !== body.confirmPassword) {
            throw new BadRequestException('Las contraseñas no coinciden');
        }

        return this.resetPasswordUseCase.execute(body.token, body.password);
    }

    @Post('validate')
    @HttpCode(HttpStatus.OK)
    async validateToken(@Body() body: ValidateTokenDto) {
        return this.validateResetTokenUseCase.execute(body.token);
    }

    @Get('info/:token')
    async obtainInfo(@Param('token') token: string) {
        return this.obtainResetInfoUseCase.execute(token);
    }
}
