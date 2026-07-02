import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidateResetTokenUseCase } from '@/modules/reset_password/application/use-cases/validate-reset-token.use-case';
import { ResetTokenValidatorService } from '@/modules/reset_password/application/services/reset-token-validator.service';
import { PASSWORD_RESET_REPOSITORY } from '@/modules/reset_password/domain/ports/password-reset-repository.port';
import { USER_REPOSITORY } from '@/modules/users/domain/ports/user-repository.port';
import { HashServicePort } from '@/shared/domain/ports/hash-service.port';
import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

/**
 * Test de regresión de DI: los use cases se resuelven vía el contenedor de
 * Nest (no con `new` manual) para detectar clases sin metadata de inyección.
 * Sin `@Injectable()` (o algún `@Inject()` en el constructor) Nest instancia
 * la clase con cero argumentos y el use case explota en runtime con
 * "Cannot read properties of undefined".
 */
describe('ResetPasswordModule DI', () => {
    let moduleRef: TestingModule;

    beforeEach(async () => {
        moduleRef = await Test.createTestingModule({
            providers: [
                ValidateResetTokenUseCase,
                ResetTokenValidatorService,
                {
                    provide: PASSWORD_RESET_REPOSITORY,
                    useValue: {
                        findByToken: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: USER_REPOSITORY,
                    useValue: {
                        findById: jest.fn(),
                    },
                },
                {
                    provide: HashServicePort,
                    useValue: {
                        hash: jest.fn((value: string) => `hashed-${value}`),
                    },
                },
            ],
        }).compile();
    });

    it('resuelve ValidateResetTokenUseCase con su validador inyectado', async () => {
        const useCase = moduleRef.get(ValidateResetTokenUseCase);

        const resetToken = new PasswordResetToken(
            1,
            1,
            'hashed-raw-token',
            TokenStatus.PENDIENTE,
            new Date(),
            null,
            new Date(Date.now() + 60 * 60 * 1000),
        );
        const user = new User(
            1,
            'John',
            'Doe',
            'john@bioactiva.com',
            'password',
            new Date(),
            UserRole.TRABAJADOR,
            UserState.ACTIVO,
            new Date(),
        );

        const passwordResetRepository = moduleRef.get<{
            findByToken: jest.Mock;
        }>(PASSWORD_RESET_REPOSITORY);
        passwordResetRepository.findByToken.mockResolvedValue(
            resetToken as never,
        );
        const userRepository = moduleRef.get<{ findById: jest.Mock }>(
            USER_REPOSITORY,
        );
        userRepository.findById.mockResolvedValue(user as never);

        await expect(useCase.execute('raw-token')).resolves.toEqual({
            correo: expect.stringContaining('@bioactiva.com'),
        });
    });
});
