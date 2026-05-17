import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import {
    PrismaService,
    PRISMA_SERVICE,
} from '@/modules/common/prisma/prisma.service';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import { UserRole } from '@/shared/enums/rol';
import {
    PASSWORD_HASHER,
    type PasswordHasherPort,
} from '@/modules/auth/domain/ports/password-hasher.port';

@Injectable()
export class AdminInitializerService implements OnApplicationBootstrap {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        @Inject(PASSWORD_HASHER)
        private readonly passwordHasher: PasswordHasherPort,
        @Inject(PRISMA_SERVICE)
        private readonly prismaService: PrismaService,
    ) {}

    async onApplicationBootstrap() {
        await this.initializeData();
    }

    private async initializeData() {
        const adminCount = await this.userRepository.count({
            where: { role: UserRole.ADMINISTRADOR },
        });

        if (adminCount === 0) {
            console.log(
                'No se encontró administrador. Creando admin por defecto...',
            );

            await this.prismaService.usuario.create({
                data: {
                    nombres: 'Admin Bioactiva',
                    apellidos: 'Por Defecto',
                    correo: process.env.ADMIN_EMAIL || '',
                    password: await this.passwordHasher.hash(
                        process.env.ADMIN_PASSWORD || '',
                    ),
                    rol: 'ADMINISTRADOR',
                    estado: 'ACTIVO',
                },
            });

            console.log('Administrador por defecto creado con éxito.');
        } else {
            console.log('El administrador ya existe. Saltando inicialización.');
        }
    }
}
