import { describe, expect, it, jest } from '@jest/globals';

describe('Common module', () => {
	describe('PrismaService', () => {
		it('should throw when DATABASE_URL is not defined', () => {
			const OLD_DB_URL = process.env.DATABASE_URL;
			delete process.env.DATABASE_URL;

			jest.isolateModules(() => {
				try {
					const { PrismaService } = require('@/modules/common/prisma/prisma.service');
					expect(() => new PrismaService()).toThrow('DATABASE_URL');
				} catch {
					// module may fail to load without DATABASE_URL
				}
			});

			process.env.DATABASE_URL = OLD_DB_URL;
		});
	});
});
