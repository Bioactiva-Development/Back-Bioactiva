import { describe, expect, it } from '@jest/globals';
import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

describe('Reset Password module', () => {
	/**
	 * PasswordResetToken Entity
	 * ----------
	 * Responsable de:
	 * - representar un token de restablecimiento con su ciclo de vida
	 * - validar transiciones de estado
	 * - prevenir operaciones inválidas
	 */
	// STATUS: Implementación completa (entity behavior + state transitions).
	describe('PasswordResetToken entity', () => {
		const userId = 1;
		const token = 'hashed-reset-token-456';
		const createdAt = new Date('2024-01-01T00:00:00Z');
		const expiredAt = new Date('2024-01-01T02:00:00Z'); // 2 horas después

		const buildResetToken = () =>
			new PasswordResetToken(
				1,
				userId,
				token,
				TokenStatus.PENDIENTE,
				createdAt,
				null,
				expiredAt,
			);

		describe('creation and initial state', () => {
			it('should create password reset token with pending status', () => {
				const resetToken = buildResetToken();

				expect(resetToken.id).toBe(1);
				expect(resetToken.user_id).toBe(userId);
				expect(resetToken.token).toBe(token);
				expect(resetToken.estado).toBe(TokenStatus.PENDIENTE);
				expect(resetToken.consumed_at).toBeNull();
			});

			it('should allow null id for new tokens', () => {
				const newToken = new PasswordResetToken(
					null,
					userId,
					token,
					TokenStatus.PENDIENTE,
					createdAt,
					null,
					expiredAt,
				);

				expect(newToken.id).toBeNull();
				expect(newToken.user_id).toBe(userId);
			});

			it('should have default estado as PENDIENTE', () => {
				const token = new PasswordResetToken(
					1,
					userId,
					'token',
					undefined,
					createdAt,
					null,
					expiredAt,
				);

				expect(token.estado).toBe(TokenStatus.PENDIENTE);
			});
		});

		describe('consume', () => {
			it('should consume pending reset token and set consumed_at', () => {
				const resetToken = buildResetToken();
				const beforeConsume = new Date();

				resetToken.consume();

				expect(resetToken.estado).toBe(TokenStatus.CONSUMIDO);
				expect(resetToken.consumed_at).not.toBeNull();
				expect(resetToken.consumed_at!.getTime()).toBeGreaterThanOrEqual(
					beforeConsume.getTime(),
				);
			});

			it('should throw error when consuming non-pending token', () => {
				const resetToken = new PasswordResetToken(
					1,
					userId,
					token,
					TokenStatus.CONSUMIDO,
					createdAt,
					new Date(),
					expiredAt,
				);

				expect(() => resetToken.consume()).toThrow('Token inválido');
			});

			it('should throw error when consuming expired token', () => {
				const resetToken = new PasswordResetToken(
					1,
					userId,
					token,
					TokenStatus.EXPIRADO,
					createdAt,
					null,
					expiredAt,
				);

				expect(() => resetToken.consume()).toThrow('Token inválido');
			});

			it('should preserve token data when consuming', () => {
				const resetToken = buildResetToken();

				resetToken.consume();

				expect(resetToken.user_id).toBe(userId);
				expect(resetToken.token).toBe(token);
				expect(resetToken.created_at).toEqual(createdAt);
			});
		});

		describe('expire', () => {
			it('should expire pending token', () => {
				const resetToken = buildResetToken();

				resetToken.expire();

				expect(resetToken.estado).toBe(TokenStatus.EXPIRADO);
			});

			it('should not throw error when expiring already expired token', () => {
				const resetToken = new PasswordResetToken(
					1,
					userId,
					token,
					TokenStatus.EXPIRADO,
					createdAt,
					null,
					expiredAt,
				);

				expect(() => resetToken.expire()).not.toThrow();
				expect(resetToken.estado).toBe(TokenStatus.EXPIRADO);
			});

			it('should not throw error when expiring already consumed token', () => {
				const resetToken = new PasswordResetToken(
					1,
					userId,
					token,
					TokenStatus.CONSUMIDO,
					createdAt,
					new Date(),
					expiredAt,
				);

				expect(() => resetToken.expire()).not.toThrow();
				expect(resetToken.estado).toBe(TokenStatus.CONSUMIDO);
			});

			it('should preserve token data when expiring', () => {
				const resetToken = buildResetToken();

				resetToken.expire();

				expect(resetToken.user_id).toBe(userId);
				expect(resetToken.token).toBe(token);
			});
		});

		describe('state transitions', () => {
			it('should track lifecycle from pending to consumed', () => {
				const resetToken = buildResetToken();

				expect(resetToken.estado).toBe(TokenStatus.PENDIENTE);

				resetToken.consume();

				expect(resetToken.estado).toBe(TokenStatus.CONSUMIDO);
				expect(resetToken.consumed_at).not.toBeNull();
			});

			it('should prevent consuming after expiration', () => {
				const resetToken = buildResetToken();

				resetToken.expire();

				expect(() => resetToken.consume()).toThrow('Token inválido');
			});

			it('should support pending -> expired transition', () => {
				const resetToken = buildResetToken();

				expect(resetToken.estado).toBe(TokenStatus.PENDIENTE);

				resetToken.expire();

				expect(resetToken.estado).toBe(TokenStatus.EXPIRADO);
			});
		});

		describe('token fields', () => {
			it('should preserve all fields correctly', () => {
				const now = new Date();
				const expiry = new Date(now.getTime() + 2 * 60 * 60 * 1000);
				const resetToken = new PasswordResetToken(
					42,
					5,
					'my-token-hash',
					TokenStatus.PENDIENTE,
					now,
					null,
					expiry,
				);

				expect(resetToken.id).toBe(42);
				expect(resetToken.user_id).toBe(5);
				expect(resetToken.token).toBe('my-token-hash');
				expect(resetToken.created_at).toEqual(now);
				expect(resetToken.expired_at).toEqual(expiry);
			});

			it('should allow setting consumed_at after consumption', () => {
				const resetToken = buildResetToken();
				const beforeConsume = new Date();

				resetToken.consume();

				expect(resetToken.consumed_at).not.toBeNull();
				expect(resetToken.consumed_at!.getTime()).toBeGreaterThanOrEqual(
					beforeConsume.getTime(),
				);
			});
		});

		describe('expiration logic', () => {
			it('should handle future expiration dates', () => {
				const futureExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
				const resetToken = new PasswordResetToken(
					1,
					userId,
					token,
					TokenStatus.PENDIENTE,
					createdAt,
					null,
					futureExpiry,
				);

				expect(resetToken.estado).toBe(TokenStatus.PENDIENTE);
			});

			it('should handle past expiration dates', () => {
				const pastExpiry = new Date(Date.now() - 1000);
				const resetToken = new PasswordResetToken(
					1,
					userId,
					token,
					TokenStatus.PENDIENTE,
					createdAt,
					null,
					pastExpiry,
				);

				expect(resetToken.expired_at < new Date()).toBe(true);
			});
		});
	});
});
