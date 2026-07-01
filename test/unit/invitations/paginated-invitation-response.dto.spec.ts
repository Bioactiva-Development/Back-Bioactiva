import { describe, expect, it } from '@jest/globals';
import { PaginatedInvitationResponseDto } from '@/modules/invitations/infrastructure/http/dto/paginated-invitation-response.dto';
import { InvitationToken } from '@/modules/invitations/domain/entities/invitation_token';
import { UserRole } from '@/shared/domain/enums/rol';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

describe('Invitations module', () => {
    describe('PaginatedInvitationResponseDto', () => {
        it('maps each invitation token to its response shape and computes pagination meta', () => {
            const invitation = new InvitationToken(
                1,
                'user@bioactiva.com',
                'token-abc',
                UserRole.VENDEDOR,
                2,
                TokenStatus.PENDIENTE,
                new Date('2026-01-01T00:00:00.000Z'),
                null,
                new Date('2026-01-08T00:00:00.000Z'),
            );

            const result = new PaginatedInvitationResponseDto(
                [invitation],
                21,
                2,
                10,
            );

            expect(result.data).toHaveLength(1);
            expect(result.data[0]).toMatchObject({
                id: 1,
                correo: 'user@bioactiva.com',
                rol: UserRole.VENDEDOR,
                estado: TokenStatus.PENDIENTE,
                consumed_at: null,
            });
            expect(result.meta).toEqual({
                page: 2,
                limit: 10,
                total: 21,
                totalPages: 3,
            });
        });
    });
});
