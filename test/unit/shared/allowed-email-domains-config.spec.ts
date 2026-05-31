import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { AllowedEmailDomainsConfig } from '@/shared/infrastructure/config/allowed-email-domains.config';

describe('Shared module', () => {
	describe('AllowedEmailDomainsConfig', () => {
		let config: AllowedEmailDomainsConfig;
		let mockConfigService: any;

		beforeEach(() => {
			mockConfigService = {
				get: jest.fn(),
			};
			config = new AllowedEmailDomainsConfig(mockConfigService);
		});

		it('should return parsed domains when ALLOWED_EMAIL_DOMAINS is set', () => {
			mockConfigService.get.mockReturnValue('bioactiva.com, example.com , TEST.COM');

			const result = config.getAllowedDomains();

			expect(result).toEqual(['bioactiva.com', 'example.com', 'test.com']);
		});

		it('should return empty array when ALLOWED_EMAIL_DOMAINS is not set', () => {
			mockConfigService.get.mockReturnValue(undefined);

			const result = config.getAllowedDomains();

			expect(result).toEqual([]);
		});

		it('should filter out empty domains', () => {
			mockConfigService.get.mockReturnValue('bioactiva.com,, ,example.com');

			const result = config.getAllowedDomains();

			expect(result).toEqual(['bioactiva.com', 'example.com']);
		});

		it('should trim whitespace from domains', () => {
			mockConfigService.get.mockReturnValue('  bioactiva.com  ,  example.com  ');

			const result = config.getAllowedDomains();

			expect(result).toEqual(['bioactiva.com', 'example.com']);
		});
	});
});
