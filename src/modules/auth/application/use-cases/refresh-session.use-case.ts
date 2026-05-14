import {
    TOKEN_SERVICE,
    type TokenServicePort,
} from '@/modules/auth/domain/ports/token-service.port';
import {
    AUTH_USER_REPOSITORY,
    type AuthUserRepositoryPort,
} from '@/modules/auth/domain/ports/user-auth-repository.port.ts';
import { TokenPair } from '@/modules/auth/domain/value-objects/token_pair';
import { NotAuthorizedException } from '@/modules/auth/domain/exceptions/not-authorized.exeption';
import { Inject } from '@nestjs/common';

export class RefreshSessionUseCase {
    constructor(
        @Inject(TOKEN_SERVICE)
        private readonly tokenService: TokenServicePort,
        @Inject(AUTH_USER_REPOSITORY)
        private readonly authUserRepository: AuthUserRepositoryPort,
    ) {}

    async execute(refreshToken: string): Promise<TokenPair> {
        const claims = await this.tokenService.verifyRefreshToken(refreshToken);
        const user = await this.authUserRepository.findById(Number(claims.sub));

        if (!user) {
            throw new NotAuthorizedException('Credenciales inválidas');
        }

        if (user.canAuthenticate() === false) {
            throw new NotAuthorizedException('El usuario no está activo');
        }

        const newAccessToken = await this.tokenService.signAccessToken({
            sub: claims.sub,
            correo: user.correo,
            nombres: user.nombres,
            apellidos: user.apellidos,
            role: user.role,
            estado: user.estado,
            tokenVersion: claims.tokenVersion,
        });

        const newRefreshToken = await this.tokenService.signRefreshToken({
            sub: claims.sub,
            tokenVersion: claims.tokenVersion,
        });

        return new TokenPair(newAccessToken, newRefreshToken, 900, 604800);
    }
}
