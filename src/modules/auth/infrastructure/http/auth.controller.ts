import {
    Body,
    Controller,
    Get,
    Post,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { AuthenticateUserUseCase } from '@/modules/auth/application/use-cases/authenticate-user.use-case';
import { RefreshSessionUseCase } from '@/modules/auth/application/use-cases/refresh-session.use-case';
import { AuthResponseDto } from '@/modules/auth/application/dto/auth-response.dto';
import { LoginDto } from '@/modules/auth/application/dto/login.dto';
import { RefreshSessionDto } from '@/modules/auth/application/dto/refresh-session.dto';
import { LoginCredentials } from '@/modules/auth/domain/value-objects/login_credentials';
import { InvalidCredentialsError } from '@/modules/auth/application/errors/invalid-credentials.error';
import { NotAuthorizedException } from '@/modules/auth/domain/exceptions/not-authorized.exeption';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { User } from '@/modules/users/domain/entities/user';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authenticateUserUseCase: AuthenticateUserUseCase,
        private readonly refreshSessionUseCase: RefreshSessionUseCase,
    ) {}

    @Post('login')
    async login(@Body() body: LoginDto): Promise<AuthResponseDto> {
        try {
            const tokenPair = await this.authenticateUserUseCase.execute(
                new LoginCredentials(body.correo, body.password),
            );

            return AuthResponseDto.fromTokenPair(tokenPair);
        } catch (error: unknown) {
            this.rethrowAsHttpError(error);
        }
    }

    @Post('refresh')
    async refresh(@Body() body: RefreshSessionDto): Promise<AuthResponseDto> {
        try {
            const tokenPair = await this.refreshSessionUseCase.execute(
                body.refreshToken,
            );

            return AuthResponseDto.fromTokenPair(tokenPair);
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
}
