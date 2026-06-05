import { Injectable } from '@shared/infrastructure/dependency-inyection/inyectable';
import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    INVITATIONS_REPOSITORY,
    type InvitationsRepositoryPort,
} from '@/modules/invitations/domain/port/invitations-repository.port';
import {
    INVITATION_POLICY,
    type InvitationPolicyPort,
} from '@/modules/invitations/domain/port/invitation-policy.port';
import { InvalidInvitationTokenException } from '@/modules/invitations/domain/exceptions/invalid-invitation-token.exception';
import { InvitationExpiredException } from '@/modules/invitations/domain/exceptions/invitation-expired.exception';
import { InvitationAlreadyAcceptedException } from '@/modules/invitations/domain/exceptions/invitation-already-accepted.exception';
import { InvalidInvitationDomainException } from '@/modules/invitations/domain/exceptions/invalid-invitation-domain.exception';
import { HashServicePort } from '@/shared/domain/ports/hash-service.port';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import {
    PASSWORD_HASHER,
    type PasswordHasherPort,
} from '@/modules/auth/domain/ports/password-hasher.port';
import {
    TOKEN_SERVICE,
    type TokenServicePort,
} from '@/modules/auth/domain/ports/token-service.port';
import { TokenPair } from '@/modules/auth/domain/value-objects/token_pair';
import { User } from '@/modules/users/domain/entities/user';
import { UserState } from '@/modules/users/domain/enums/estado';

@Injectable()
export class AcceptInvitationUseCase {
    constructor(
        @Inject(INVITATIONS_REPOSITORY)
        private readonly invitationsRepository: InvitationsRepositoryPort,
        @Inject(INVITATION_POLICY)
        private readonly invitationPolicy: InvitationPolicyPort,
        @Inject(HashServicePort)
        private readonly hashService: HashServicePort,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        @Inject(PASSWORD_HASHER)
        private readonly passwordHasher: PasswordHasherPort,
        @Inject(TOKEN_SERVICE)
        private readonly tokenService: TokenServicePort,
    ) {}

    async execute(
        token: string,
        password: string,
        nombres: string,
        apellidos: string,
    ): Promise<TokenPair> {
        const token_hash = this.hashService.hash(token);
        const invitation =
            await this.invitationsRepository.findByToken(token_hash);
        const user = await this.userRepository.findByCorreo(
            invitation?.correo ?? '',
        );

        if (user?.estado === UserState.ACTIVO) {
            throw new InvalidInvitationDomainException(
                'Ya existe un usuario activo con este correo',
            );
        }

        if (!invitation) {
            throw new InvalidInvitationTokenException('Token inválido');
        }

        if (invitation.isExpired()) {
            throw new InvitationExpiredException('Token vencido');
        }

        if (invitation.isAccepted()) {
            throw new InvitationAlreadyAcceptedException('Token ya consumido');
        }

        if (!this.invitationPolicy.isAllowedDomain(invitation.correo)) {
            throw new InvalidInvitationDomainException('Dominio no permitido');
        }

        invitation.accept();
        await this.invitationsRepository.save(invitation);
        const activatedUser = new User(
            user?.id ?? null,
            nombres,
            apellidos,
            invitation.correo,
            await this.passwordHasher.hash(password),
            new Date(),
            invitation.rol,
            UserState.ACTIVO,
            new Date(),
        );
        const savedUser = await this.userRepository.save(activatedUser);

        const accessToken = await this.tokenService.signAccessToken({
            sub: String(savedUser.id),
            correo: savedUser.correo,
            nombres: savedUser.nombres,
            apellidos: savedUser.apellidos,
            role: savedUser.role,
            estado: savedUser.estado,
        });

        const refreshToken = await this.tokenService.signRefreshToken({
            sub: String(savedUser.id),
        });

        return new TokenPair(accessToken, refreshToken, 900, 604800);
    }
}
