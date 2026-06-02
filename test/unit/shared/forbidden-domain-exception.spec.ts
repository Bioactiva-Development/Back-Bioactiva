import { describe, expect, it } from '@jest/globals';
import { ForbiddenDomainException } from '@/shared/domain/exceptions/forbidden-domain.exception';
import { DomainErrorKind } from '@/shared/domain/exceptions/domain-error-kind';

describe('Shared module', () => {
	describe('ForbiddenDomainException', () => {
		it('should create concrete instance with Forbidden kind', () => {
			class ConcreteForbidden extends ForbiddenDomainException {
				constructor(msg: string) { super(msg); }
			}
			const ex = new ConcreteForbidden('Access denied');
			expect(ex.kind).toBe(DomainErrorKind.Forbidden);
			expect(ex.message).toBe('Access denied');
		});
	});
});
