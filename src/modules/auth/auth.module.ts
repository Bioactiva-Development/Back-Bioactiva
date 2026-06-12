import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticateUserUseCase } from '@/modules/auth/application/use-cases/authenticate-user.use-case';
import { RefreshSessionUseCase } from '@/modules/auth/application/use-cases/refresh-session.use-case';
import { AUTH_USER_REPOSITORY } from '@/modules/auth/domain/ports/user-auth-repository.port';
import { PASSWORD_HASHER } from '@/modules/auth/domain/ports/password-hasher.port';
import { TOKEN_SERVICE } from '@/modules/auth/domain/ports/token-service.port';
import { AuthController } from '@/modules/auth/infrastructure/http/auth.controller';
import { JwtTokenService } from '@/modules/auth/infrastructure/jwt/jwt-token.service';
import { JwtStrategy } from '@/modules/auth/infrastructure/jwt/jwt.strategy';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/infrastructure/jwt/guards/roles.guard';
import { BcryptPasswordHasher } from '@/modules/auth/infrastructure/hash/bcrypt-password-hasher';
import { PrismaUserAuthRepository } from '@/modules/auth/infrastructure/persistance/prisma-user-auth.repository';

@Module({
    imports: [PassportModule, JwtModule.register({})],
    controllers: [AuthController],
    providers: [
        AuthenticateUserUseCase,
        RefreshSessionUseCase,
        JwtTokenService,
        BcryptPasswordHasher,
        PrismaUserAuthRepository,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        { provide: TOKEN_SERVICE, useExisting: JwtTokenService },
        { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
        {
            provide: AUTH_USER_REPOSITORY,
            useExisting: PrismaUserAuthRepository,
        },
    ],
    exports: [PASSWORD_HASHER, JwtAuthGuard, RolesGuard, TOKEN_SERVICE],
})
export class AuthModule {}
