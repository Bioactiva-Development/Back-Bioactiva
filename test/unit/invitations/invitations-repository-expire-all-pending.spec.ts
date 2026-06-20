import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';
import { PrismaInvitationsRepository } from '@/modules/invitations/infrastructure/persistance/prisma-invitation.repository';

describe('Invitations module', () => {
    /**
     * PrismaInvitationsRepository.expireAllPending
     * ----------
     * Marca como EXPIRADO todas las invitaciones pendientes cuyos ids se
     * pasen. Si la lista está vacía, no toca la base y devuelve 0.
     */
    describe('PrismaInvitationsRepository (expireAllPending)', () => {
        let repository: PrismaInvitationsRepository;
        let prismaMock: jest.Mocked<PrismaClient>;

        beforeEach(() => {
            prismaMock = {
                userToken: {
                    updateMany: jest.fn(),
                },
            } as unknown as jest.Mocked<PrismaClient>;

            repository = new PrismaInvitationsRepository(prismaMock);
        });

        it('should return 0 and not touch the database when ids is empty', async () => {
            const result = await repository.expireAllPending([]);

            expect(result).toBe(0);
            expect(prismaMock.userToken.updateMany).not.toHaveBeenCalled();
        });

        it('should expire all pending invitations for the given ids and return the count', async () => {
            (prismaMock.userToken.updateMany as jest.Mock).mockResolvedValue({
                count: 2,
            } as never);

            const result = await repository.expireAllPending([1, 2, 3]);

            expect(prismaMock.userToken.updateMany).toHaveBeenCalledWith({
                where: {
                    id: { in: [1, 2, 3] },
                    proposito: 'INVITACION',
                    estado: 'PENDIENTE',
                },
                data: { estado: 'EXPIRADO' },
            });
            expect(result).toBe(2);
        });
    });
});
