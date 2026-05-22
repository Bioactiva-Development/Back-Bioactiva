import {
    BadRequestException,
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
} from '@nestjs/common';
import { RequestPasswordResetUseCase } from '@/modules/reset_password/application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '@/modules/reset_password/application/use-cases/reset-password.use-case';
import { ValidateResetTokenUseCase } from '@/modules/reset_password/application/use-cases/validate-reset-token.use-case';
import { RequestResetDto } from './dto/request-reset.dto.http';
import { ResetPasswordDto } from './dto/reset-password.dto.http';
import { ValidateTokenDto } from './dto/validate-token.dto.http';
import { InvalidResetTokenException } from '@/modules/reset_password/domain/exeptions/invalid-reset-token.exception';
import { ResetTokenExpiredException } from '@/modules/reset_password/domain/exeptions/reset-token-expired.exception';

@Controller('reset-password')
export class ResetPasswordController {
    constructor(
        private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
        private readonly resetPasswordUseCase: ResetPasswordUseCase,
        private readonly validateResetTokenUseCase: ValidateResetTokenUseCase,
    ) {}

    @Post('request')
    @HttpCode(HttpStatus.OK)
    async requestReset(@Body() body: RequestResetDto) {
        return this.requestPasswordResetUseCase.execute(body.correo);
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() body: ResetPasswordDto) {
        if (body.password !== body.confirmPassword) {
            throw new BadRequestException('Las contraseñas no coinciden');
        }

        try {
            return await this.resetPasswordUseCase.execute(
                body.token,
                body.password,
            );
        } catch (error) {
            if (error instanceof InvalidResetTokenException) {
                throw new BadRequestException(error.message);
            }
            if (error instanceof ResetTokenExpiredException) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    @Post('validate')
    @HttpCode(HttpStatus.OK)
    async validateToken(@Body() body: ValidateTokenDto) {
        try {
            return await this.validateResetTokenUseCase.execute(body.token);
        } catch (error) {
            if (error instanceof InvalidResetTokenException) {
                throw new BadRequestException(error.message);
            }
            if (error instanceof ResetTokenExpiredException) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }
}
