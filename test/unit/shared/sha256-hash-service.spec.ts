import { describe, expect, it, beforeEach } from '@jest/globals';
import { Sha256HashService } from '@/shared/infrastructure/service/sha256-hash.service';
import { createHash } from 'node:crypto';

describe('Shared module', () => {
	describe('Sha256HashService', () => {
		let service: Sha256HashService;

		beforeEach(() => {
			service = new Sha256HashService();
		});

		it('should hash a value using SHA-256', () => {
			const value = 'test-value';
			const result = service.hash(value);

			const expected = createHash('sha256').update(value).digest('hex');
			expect(result).toBe(expected);
		});

		it('should produce different hashes for different inputs', () => {
			const hash1 = service.hash('value1');
			const hash2 = service.hash('value2');

			expect(hash1).not.toBe(hash2);
		});

		it('should compare matching plain and hashed values', () => {
			const plain = 'my-secret-token';
			const hashed = service.hash(plain);

			expect(service.compare(plain, hashed)).toBe(true);
		});

		it('should compare non-matching plain and hashed values', () => {
			const hashed = service.hash('original');

			expect(service.compare('different', hashed)).toBe(false);
		});

		it('should produce consistent hashes for the same input', () => {
			const value = 'consistent-value';

			expect(service.hash(value)).toBe(service.hash(value));
		});
	});
});
