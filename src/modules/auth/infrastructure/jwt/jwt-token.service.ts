import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { TokenServicePort } from '@/modules/auth/domain/ports/token-service.port';
import {
    JwtClaims,
    RefreshJwtClaims,
} from '@/modules/auth/domain/value-objects/jwt_claims';

@Injectable()
export class JwtTokenService implements TokenServicePort {
    constructor(private readonly jwtService: JwtService) {}

    private requireEnv(name: string): string {
        const value = process.env[name];

        if (!value) {
            throw new Error(`Falta la variable de entorno ${name}`);
        }

        return value;
    }

    signAccessToken(payload: JwtClaims): string {
        return this.jwtService.sign(payload, {
            secret: this.requireEnv('JWT_SECRET'),
            expiresIn: this.requireEnv(
                'JWT_EXPIRES_IN',
            ) as JwtSignOptions['expiresIn'],
            issuer: this.requireEnv('JWT_ISSUER'),
            audience: this.requireEnv('JWT_AUDIENCE'),
        });
    }

    verifyAccessToken(token: string): JwtClaims {
        return this.jwtService.verify<JwtClaims>(token, {
            secret: this.requireEnv('JWT_SECRET'),
            issuer: this.requireEnv('JWT_ISSUER'),
            audience: this.requireEnv('JWT_AUDIENCE'),
        });
    }

    signRefreshToken(payload: RefreshJwtClaims): string {
        return this.jwtService.sign(payload, {
            secret: this.requireEnv('JWT_REFRESH_SECRET'),
            expiresIn: this.requireEnv(
                'JWT_REFRESH_EXPIRES_IN',
            ) as JwtSignOptions['expiresIn'],
            issuer: this.requireEnv('JWT_ISSUER'),
            audience: this.requireEnv('JWT_AUDIENCE'),
        });
    }

    verifyRefreshToken(token: string): RefreshJwtClaims {
        return this.jwtService.verify<RefreshJwtClaims>(token, {
            secret: this.requireEnv('JWT_REFRESH_SECRET'),
            issuer: this.requireEnv('JWT_ISSUER'),
            audience: this.requireEnv('JWT_AUDIENCE'),
        });
    }
}
