import {
    Body,
    Controller,
    Get,
    HttpCode,
    Post,
    Res,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiHeader } from '@nestjs/swagger';
import { AuthenticateUserUseCase } from '@/modules/auth/application/use-cases/authenticate-user.use-case';
import { RefreshSessionUseCase } from '@/modules/auth/application/use-cases/refresh-session.use-case';
import { AuthResponseDto } from '@/modules/auth/application/dto/auth-response.dto';
import { LoginCredentials } from '@/modules/auth/domain/value-objects/login_credentials';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { ExtractCookie } from '@/modules/auth/infrastructure/http/decorator/cookie.decorator';
import {
    RecaptchaGuard,
    RECAPTCHA_TOKEN_HEADER,
} from '@/modules/auth/infrastructure/http/guards/recaptcha.guard';
import { REFRESH_TOKEN_COOKIE_NAME } from '@/modules/auth/infrastructure/http/cookie-names';
import { User } from '@/modules/users/domain/entities/user';
import { LoginDto } from '@/modules/auth/infrastructure/http/dtos/login.dto.http';
import { MeResponseDto } from '@/modules/auth/application/dto/me-response.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authenticateUserUseCase: AuthenticateUserUseCase,
        private readonly refreshSessionUseCase: RefreshSessionUseCase,
    ) {}

    @Post('login')
    @HttpCode(200)
    @UseGuards(RecaptchaGuard)
    @ApiHeader({
        name: RECAPTCHA_TOKEN_HEADER,
        description: 'Token de reCAPTCHA Enterprise generado por el frontend',
        required: true,
    })
    async login(
        @Body() body: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ): Promise<AuthResponseDto> {
        const tokenPair = await this.authenticateUserUseCase.execute(
            new LoginCredentials(body.correo, body.password),
        );

        this.setRefreshTokenCookie(response, tokenPair.refreshToken);

        return AuthResponseDto.fromTokenPair(
            tokenPair.accessToken,
            tokenPair.accessTokenExpiresIn,
        );
    }

    @Post('refresh')
    @HttpCode(200)
    async refresh(
        @Res({ passthrough: true }) response: Response,
        @ExtractCookie(REFRESH_TOKEN_COOKIE_NAME)
        refreshTokenFromCookie: string | null,
    ): Promise<AuthResponseDto> {
        if (!refreshTokenFromCookie) {
            throw new UnauthorizedException('No autorizado');
        }

        const tokenPair = await this.refreshSessionUseCase.execute(
            refreshTokenFromCookie,
        );

        this.setRefreshTokenCookie(response, tokenPair.refreshToken);

        return AuthResponseDto.fromTokenPair(
            tokenPair.accessToken,
            tokenPair.accessTokenExpiresIn,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@CurrentUser() user: User): MeResponseDto {
        return new MeResponseDto(user);
    }

    private setRefreshTokenCookie(response: Response, refreshToken: string) {
        const isProduction = process.env.NODE_ENV === 'production';

        response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
            httpOnly: true,
            // En prod el front y la API están en sitios distintos: la cookie
            // debe viajar cross-site (SameSite=None), lo que obliga a
            // Secure=true (HTTPS). En dev (mismo host localhost, HTTP) se
            // mantiene Lax + no-secure. Requiere NODE_ENV=production en prod.
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            path: '/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }
}
