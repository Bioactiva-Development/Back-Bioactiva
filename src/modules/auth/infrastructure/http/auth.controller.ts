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
import { AuthenticateUserUseCase } from '@/modules/auth/application/use-cases/authenticate-user.use-case';
import { RefreshSessionUseCase } from '@/modules/auth/application/use-cases/refresh-session.use-case';
import { AuthResponseDto } from '@/modules/auth/application/dto/auth-response.dto';
import { LoginCredentials } from '@/modules/auth/domain/value-objects/login_credentials';
import { InvalidCredentialsError } from '@/modules/auth/application/errors/invalid-credentials.error';
import { NotAuthorizedException } from '@/modules/auth/domain/exceptions/not-authorized.exeption';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { ExtractCookie } from '@/modules/auth/infrastructure/http/decorator/cookie.decorator';
import { REFRESH_TOKEN_COOKIE_NAME } from '@/modules/auth/infrastructure/http/cookie-names';
import { User } from '@/modules/users/domain/entities/user';
import { LoginDto } from '@/modules/auth/infrastructure/http/dtos/login.dto.http';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authenticateUserUseCase: AuthenticateUserUseCase,
        private readonly refreshSessionUseCase: RefreshSessionUseCase,
    ) {}

    @Post('login')
    @HttpCode(200)
    async login(
        @Body() body: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ): Promise<AuthResponseDto> {
        try {
            const tokenPair = await this.authenticateUserUseCase.execute(
                new LoginCredentials(body.correo, body.password),
            );

            this.setRefreshTokenCookie(response, tokenPair.refreshToken);

            return AuthResponseDto.fromTokenPair(
                tokenPair.accessToken,
                tokenPair.accessTokenExpiresIn,
            );
        } catch (error: unknown) {
            this.rethrowAsHttpError(error);
        }
    }

    @Post('refresh')
    @HttpCode(200)
    async refresh(
        @Res({ passthrough: true }) response: Response,
        @ExtractCookie(REFRESH_TOKEN_COOKIE_NAME)
        refreshTokenFromCookie: string | null,
    ): Promise<AuthResponseDto> {
        try {
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
        } catch (error: unknown) {
            this.rethrowAsHttpError(error);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@CurrentUser() user: User): User {
        return user;
    }

    private rethrowAsHttpError(error: unknown): never {
        if (
            error instanceof NotAuthorizedException ||
            error instanceof InvalidCredentialsError
        ) {
            throw new UnauthorizedException(error.message);
        }

        throw error;
    }

    private setRefreshTokenCookie(response: Response, refreshToken: string) {
        const isProduction = process.env.NODE_ENV === 'production';

        response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }
}
