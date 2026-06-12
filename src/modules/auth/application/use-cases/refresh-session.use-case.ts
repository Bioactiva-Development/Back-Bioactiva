import {
    TOKEN_SERVICE,
    type TokenServicePort,
} from '@/modules/auth/domain/ports/token-service.port';
import {
    AUTH_USER_REPOSITORY,
    type AuthUserRepositoryPort,
} from '@/modules/auth/domain/ports/user-auth-repository.port';
import { TokenPair } from '@/modules/auth/domain/value-objects/token_pair';
import { NotAuthorizedException } from '@/modules/auth/domain/exceptions/not-authorized.exeption';
import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import type { RefreshJwtClaims } from '@/modules/auth/domain/value-objects/jwt_claims';

export class RefreshSessionUseCase {
    constructor(
        @Inject(TOKEN_SERVICE)
        private readonly tokenService: TokenServicePort,
        @Inject(AUTH_USER_REPOSITORY)
        private readonly authUserRepository: AuthUserRepositoryPort,
    ) {}

    async execute(refreshToken: string): Promise<TokenPair> {
        // Un refresh token expirado o inválido debe traducirse a 401 para que
        // el cliente cierre la sesión y redirija al login; sin este try/catch
        // el error de verificación se propagaría como 500 (Mantis #104).
        let claims: RefreshJwtClaims;
        try {
            claims = await this.tokenService.verifyRefreshToken(refreshToken);
        } catch {
            throw new NotAuthorizedException('La sesión ha expirado');
        }

        const user = await this.authUserRepository.findById(Number(claims.sub));

        if (!user) {
            throw new NotAuthorizedException('Credenciales inválidas');
        }

        if (user.canAuthenticate() === false) {
            throw new NotAuthorizedException('El usuario no está activo');
        }

        // El refresh solo es válido para la sesión vigente: si el usuario se
        // autenticó de nuevo en otro dispositivo, su tokenVersion avanzó y este
        // token quedó obsoleto (sesión única por cuenta — Mantis #271).
        if (claims.tokenVersion !== user.tokenVersion) {
            throw new NotAuthorizedException('La sesión ha expirado');
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
