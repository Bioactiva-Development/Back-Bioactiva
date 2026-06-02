import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ObtainInfoUseCase } from '@/modules/invitations/application/use-cases/obtain-info-use-case';
import { InvitationToken } from '@/modules/invitations/domain/entities/invitation_token';
import { UserRole } from '@/shared/domain/enums/rol';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

describe('Invitations module', () => {
	describe('ObtainInfoUseCase', () => {
		let useCase: ObtainInfoUseCase;
		let mockRepository: any;
		let mockHashService: any;

		beforeEach(() => {
			mockRepository = {
				findByToken: jest.fn(),
			};
			mockHashService = {
				hash: jest.fn((token: string) => `hashed-${token}`),
			};
			useCase = new ObtainInfoUseCase(mockRepository, mockHashService);
		});

		it('should return masked email and status for valid pending token', async () => {
			const invitation = new InvitationToken(1, 'john.doe@bioactiva.com', 'hashed-raw-token', UserRole.TRABAJADOR, 1, TokenStatus.PENDIENTE, new Date(), null, new Date(Date.now() + 3600000));
			mockRepository.findByToken.mockResolvedValue(invitation);

			const result = await useCase.execute('raw-token');

			expect(mockHashService.hash).toHaveBeenCalledWith('raw-token');
			expect(mockRepository.findByToken).toHaveBeenCalledWith('hashed-raw-token');
			expect(result.correo).toBe('j******e@bioactiva.com');
			expect(result.expired).toBe(false);
			expect(result.accepted).toBe(false);
		});

		it('should return expired=true for expired invitation', async () => {
			const invitation = new InvitationToken(1, 'user@bioactiva.com', 'hashed-token', UserRole.TRABAJADOR, 1, TokenStatus.PENDIENTE, new Date(), null, new Date(Date.now() - 1000));
			mockRepository.findByToken.mockResolvedValue(invitation);

			const result = await useCase.execute('token');

			expect(result.expired).toBe(true);
		});

		it('should return accepted=true for consumed invitation', async () => {
			const invitation = new InvitationToken(1, 'user@bioactiva.com', 'hashed-token', UserRole.TRABAJADOR, 1, TokenStatus.CONSUMIDO, new Date(), new Date(), new Date(Date.now() + 3600000));
			mockRepository.findByToken.mockResolvedValue(invitation);

			const result = await useCase.execute('token');

			expect(result.accepted).toBe(true);
		});

		it('should handle short local part in email masking (2 chars)', async () => {
			const invitation = new InvitationToken(1, 'ab@bioactiva.com', 'hashed-token', UserRole.TRABAJADOR, 1, TokenStatus.PENDIENTE, new Date(), null, new Date(Date.now() + 3600000));
			mockRepository.findByToken.mockResolvedValue(invitation);

			const result = await useCase.execute('token');

			expect(result.correo).toBe('a*@bioactiva.com');
		});

		it('should handle single char local part in email masking', async () => {
			const invitation = new InvitationToken(1, 'a@bioactiva.com', 'hashed-token', UserRole.TRABAJADOR, 1, TokenStatus.PENDIENTE, new Date(), null, new Date(Date.now() + 3600000));
			mockRepository.findByToken.mockResolvedValue(invitation);

			const result = await useCase.execute('token');

			expect(result.correo).toBe('a@bioactiva.com');
		});

		it('should throw when token not found', async () => {
			mockRepository.findByToken.mockResolvedValue(null);

			await expect(useCase.execute('invalid-token')).rejects.toThrow('Token no encontrado');
		});
	});
});
