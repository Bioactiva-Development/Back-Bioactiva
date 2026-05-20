import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
    AUTH_USER_REPOSITORY,
    type AuthUserRepositoryPort,
} from '@/modules/auth/domain/ports/user-auth-repository.port';
import { UserState } from '@/modules/users/domain/enums/estado';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @Inject(AUTH_USER_REPOSITORY)
        private readonly authUserRepository: AuthUserRepositoryPort,
    ) {
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error('JWT_SECRET no configurado');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE,
        });
    }

    async validate(payload: { sub: string }) {
        const user = await this.authUserRepository.findById(
            Number(payload.sub),
        );

        if (!user || user.estado !== UserState.ACTIVO) {
            throw new UnauthorizedException('No autorizado');
        }

        return user;
    }
}
