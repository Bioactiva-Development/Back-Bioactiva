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
            process.env.ADMIN_EMAIL = 'admin@bioactiva.com';
            process.env.ADMIN_PASSWORD = 'test-admin-password';

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

        afterEach(() => {
            delete process.env.ADMIN_EMAIL;
            delete process.env.ADMIN_PASSWORD;
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

        it('should throw when ADMIN_EMAIL or ADMIN_PASSWORD are missing', async () => {
            delete process.env.ADMIN_EMAIL;
            delete process.env.ADMIN_PASSWORD;
            mockUserRepository.count.mockResolvedValue(0);

            await expect(service.onApplicationBootstrap()).rejects.toThrow(
                'ADMIN_EMAIL y ADMIN_PASSWORD son requeridos para crear el administrador inicial',
            );
            expect(mockPrismaService.usuario.create).not.toHaveBeenCalled();
        });

        it('should propagate repository errors', async () => {
            mockUserRepository.count.mockRejectedValue(new Error('DB error'));

            await expect(service.onApplicationBootstrap()).rejects.toThrow(
                'DB error',
            );
        });
    });
});
