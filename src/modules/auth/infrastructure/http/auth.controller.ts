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
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
    ApiBearerAuth,
    ApiHeader,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
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
import { getRefreshTokenCookieName } from '@/modules/auth/infrastructure/http/cookie-names';
import { User } from '@/modules/users/domain/entities/user';
import { LoginDto } from '@/modules/auth/infrastructure/http/dtos/login.dto.http';
import { MeResponseDto } from '@/modules/auth/application/dto/me-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authenticateUserUseCase: AuthenticateUserUseCase,
        private readonly refreshSessionUseCase: RefreshSessionUseCase,
    ) {}

    @Throttle({ default: { ttl: 15 * 60_000, limit: 5 } })
    @Post('login')
    @HttpCode(200)
    @UseGuards(RecaptchaGuard)
    @ApiOperation({
        summary: 'Iniciar sesión',
        description:
            'Autentica al usuario con correo y contraseña. Devuelve el access token en el body y setea el refresh token en una cookie httpOnly (`Set-Cookie`, path `/auth/refresh`). Limitado a 5 intentos cada 15 minutos por IP.',
    })
    @ApiHeader({
        name: RECAPTCHA_TOKEN_HEADER,
        description: 'Token de reCAPTCHA Enterprise generado por el frontend',
        required: true,
    })
    @ApiResponse({
        status: 200,
        description: 'Autenticación exitosa',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: 401,
        description:
            'Credenciales inválidas o token de reCAPTCHA ausente/inválido',
    })
    @ApiResponse({
        status: 429,
        description: 'Demasiados intentos de inicio de sesión',
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

    @Throttle({ default: { ttl: 60_000, limit: 10 } })
    @Post('refresh')
    @HttpCode(200)
    @ApiOperation({
        summary: 'Renovar el access token',
        description:
            'Usa el refresh token enviado en la cookie httpOnly `refresh_token` (path `/auth/refresh`) para emitir un nuevo par de tokens y rota la cookie. Limitado a 10 solicitudes por minuto por IP.',
    })
    @ApiResponse({
        status: 200,
        description: 'Token renovado exitosamente',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: 401,
        description:
            'Falta la cookie de refresh o el token es inválido/expirado',
    })
    async refresh(
        @Res({ passthrough: true }) response: Response,
        @ExtractCookie()
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
    @ApiBearerAuth()
    @Get('me')
    @ApiOperation({ summary: 'Obtener los datos del usuario autenticado' })
    @ApiResponse({ status: 200, type: MeResponseDto })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    me(@CurrentUser() user: User): MeResponseDto {
        return new MeResponseDto(user);
    }

    private setRefreshTokenCookie(response: Response, refreshToken: string) {
        const isProduction = process.env.NODE_ENV === 'production';

        response.cookie(getRefreshTokenCookieName(), refreshToken, {
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
