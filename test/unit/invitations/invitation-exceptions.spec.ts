import { describe, expect, it } from '@jest/globals';
import { InvitationRevokedException } from '@/modules/invitations/domain/exceptions/invitation-revoked.exception';
import { ConflictDomainException } from '@/shared/domain/exceptions/conflict-domain.exception';

describe('Invitation Exceptions', () => {
    describe('InvitationRevokedException', () => {
        it('should create instance with message', () => {
            const exception = new InvitationRevokedException('Token has been revoked');
            expect(exception).toBeInstanceOf(ConflictDomainException);
            expect(exception.message).toBe('Token has been revoked');
        });
    });
});
