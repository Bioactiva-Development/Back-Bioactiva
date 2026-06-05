import { Inject, Injectable } from '@nestjs/common';
import {
    PRISMA_SERVICE,
    PrismaService,
} from '@/modules/common/prisma/prisma.service';
import { AdminInitializerService } from '@/modules/users/infrastructure/data-init/users-initializer.service';

@Injectable()
export class ResetService {
    constructor(
        @Inject(PRISMA_SERVICE)
        private readonly prismaService: PrismaService,
        private readonly adminInitializer: AdminInitializerService,
    ) {}

    async resetDatabase(): Promise<void> {
        const tables = [
            'paso_seguimiento',
            'secuencia_seguimiento',
            'recordatorio_actividad',
            'notificacion',
            'actividad',
            'cotizacion',
            'lead',
            'contacto',
            'organizacion',
            'integracion_microsoft',
            'user_token',
            'template_email',
            'usuario',
        ];

        await this.prismaService.$executeRawUnsafe(
            `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`,
        );

        await this.adminInitializer.initializeData();
    }
}
