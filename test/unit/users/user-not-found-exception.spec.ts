import { describe, expect, it } from '@jest/globals';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user-not-found.exception';

describe('Users module', () => {
    describe('UserNotFoundException', () => {
        it('should create exception with default message', () => {
            const exception = new UserNotFoundException(1);
            expect(exception.message).toContain('1');
            expect(exception.kind).toBeDefined();
        });
    });
});
