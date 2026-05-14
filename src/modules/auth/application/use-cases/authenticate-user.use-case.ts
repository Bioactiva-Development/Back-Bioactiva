import { Inject } from '@nestjs/common';
import { LoginCredentials } from '@/modules/auth/domain/value-objects/login_credentials';
import { TokenPair } from '@/modules/auth/domain/value-objects/token_pair';
import {
    AUTH_USER_REPOSITORY,
    type AuthUserRepositoryPort,
} from '@/modules/auth/domain/ports/user-auth-repository.port.ts';
import {
    PASSWORD_HASHER,
    type PasswordHasherPort,
} from '@/modules/auth/domain/ports/password-hasher.port';
import {
    TOKEN_SERVICE,
    type TokenServicePort,
} from '@/modules/auth/domain/ports/token-service.port';
import { NotAuthorizedException } from '@/modules/auth/domain/exceptions/not-authorized.exeption';

export class AuthenticateUserUseCase {
    constructor(
        @Inject(AUTH_USER_REPOSITORY)
        private readonly authUserRepository: AuthUserRepositoryPort,
        @Inject(PASSWORD_HASHER)
        private readonly passwordHasher: PasswordHasherPort,
        @Inject(TOKEN_SERVICE)
        private readonly tokenService: TokenServicePort,
    ) {}

    async execute(credentials: LoginCredentials): Promise<TokenPair> {
        const user = await this.authUserRepository.findByCorreo(
            credentials.correo,
        );

        if (!user) {
            throw new NotAuthorizedException('Credenciales inválidas');
        }

        if (user.canAuthenticate() === false) {
            throw new NotAuthorizedException('El usuario no está activo');
        }

        const passwordMatches = await this.passwordHasher.compare(
            credentials.password,
            user.password,
        );

        if (!passwordMatches) {
            throw new NotAuthorizedException('Credenciales inválidas');
        }

        const accessToken = await this.tokenService.signAccessToken({
            sub: String(user.id),
            correo: user.correo,
            nombres: user.nombres,
            apellidos: user.apellidos,
            role: user.role,
            estado: user.estado,
        });

        const refreshToken = await this.tokenService.signRefreshToken({
            sub: String(user.id),
        });

        return new TokenPair(accessToken, refreshToken, 900, 604800);
    }
}
