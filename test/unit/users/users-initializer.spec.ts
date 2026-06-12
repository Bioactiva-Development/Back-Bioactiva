import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { AdminInitializerService } from '@/modules/users/infrastructure/data-init/users-initializer.service';
import { UserRole } from '@/shared/domain/enums/rol';

describe('Users module', () => {
    describe('AdminInitializerService', () => {
        let service: AdminInitializerService;
        let mockUserRepository: any;
        let mockPasswordHasher: any;
        let mockPrismaService: any;

        beforeEach(() => {
            mockUserRepository = {
                count: jest.fn(),
            };
            mockPasswordHasher = {
                hash: jest.fn().mockResolvedValue('hashed-admin-password'),
            };
            mockPrismaService = {
                usuario: {
                    create: jest.fn(),
                },
            };

            service = new AdminInitializerService(
                mockUserRepository,
                mockPasswordHasher,
                mockPrismaService,
            );
        });

        it('should create default admin when no admin exists', async () => {
            mockUserRepository.count.mockResolvedValue(0);

            await service.onApplicationBootstrap();

            expect(mockUserRepository.count).toHaveBeenCalledWith({
                where: { role: UserRole.ADMINISTRADOR },
            });
            expect(mockPasswordHasher.hash).toHaveBeenCalled();
            expect(mockPrismaService.usuario.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        nombres: 'Admin Bioactiva',
                        rol: 'ADMINISTRADOR',
                        estado: 'ACTIVO',
                    }),
                }),
            );
        });

        it('should skip creation when admin already exists', async () => {
            mockUserRepository.count.mockResolvedValue(1);

            await service.onApplicationBootstrap();

            expect(mockUserRepository.count).toHaveBeenCalled();
            expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
            expect(mockPrismaService.usuario.create).not.toHaveBeenCalled();
        });

        it('should handle empty env vars for admin credentials', async () => {
            mockUserRepository.count.mockResolvedValue(0);

            await service.onApplicationBootstrap();

            expect(mockPrismaService.usuario.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        correo: '',
                        password: 'hashed-admin-password',
                    }),
                }),
            );
        });

        it('should propagate repository errors', async () => {
            mockUserRepository.count.mockRejectedValue(new Error('DB error'));

            await expect(service.onApplicationBootstrap()).rejects.toThrow(
                'DB error',
            );
        });
    });
});
