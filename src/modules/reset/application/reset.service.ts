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
            'PasoSeguimiento',
            'SecuenciaSeguimiento',
            'RecordatorioActividad',
            'Notificacion',
            'Actividad',
            'Cotizacion',
            'Lead',
            'Contacto',
            'Organizacion',
            'IntegracionMicrosoft',
            'UserToken',
            'TemplateEmail',
            'Usuario',
        ];

        await this.prismaService.$executeRawUnsafe(
            `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`,
        );

        await this.adminInitializer.initializeData();
    }
}
