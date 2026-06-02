import { describe, expect, it } from '@jest/globals';
import { TokenMapper } from '@/shared/infrastructure/mapper/token.mapper';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

describe('Shared module', () => {
	describe('TokenMapper', () => {
		describe('mapTokenStatus', () => {
			it('should map PENDIENTE Prisma status', () => {
				expect(TokenMapper.mapTokenStatus('PENDIENTE' as any)).toBe(TokenStatus.PENDIENTE);
			});

			it('should map CONSUMIDO Prisma status', () => {
				expect(TokenMapper.mapTokenStatus('CONSUMIDO' as any)).toBe(TokenStatus.CONSUMIDO);
			});

			it('should map EXPIRADO Prisma status', () => {
				expect(TokenMapper.mapTokenStatus('EXPIRADO' as any)).toBe(TokenStatus.EXPIRADO);
			});

			it('should throw for unsupported Prisma status', () => {
				expect(() => TokenMapper.mapTokenStatus('UNKNOWN' as any)).toThrow('Unsupported Prisma token status');
			});
		});

		describe('mapTokenStatusToPrisma', () => {
			it('should map PENDIENTE domain status', () => {
				expect(TokenMapper.mapTokenStatusToPrisma(TokenStatus.PENDIENTE)).toBe('PENDIENTE');
			});

			it('should map CONSUMIDO domain status', () => {
				expect(TokenMapper.mapTokenStatusToPrisma(TokenStatus.CONSUMIDO)).toBe('CONSUMIDO');
			});

			it('should map EXPIRADO domain status', () => {
				expect(TokenMapper.mapTokenStatusToPrisma(TokenStatus.EXPIRADO)).toBe('EXPIRADO');
			});

			it('should throw for unsupported domain status', () => {
				expect(() => TokenMapper.mapTokenStatusToPrisma('INVALID' as any)).toThrow('Unsupported token status');
			});
		});
	});
});
