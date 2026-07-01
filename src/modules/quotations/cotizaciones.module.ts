import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '@/modules/common/prisma/prisma.module';
import { LeadsModule } from '@/modules/leads/leads.module';
import { UsersModule } from '@/modules/users/user.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { OFFERED_LEAD_HANDLER } from '@/modules/leads/domain/ports/offered-lead-handler.port';
import { CotizacionController } from '@/modules/quotations/infrastructure/http/cotizacion.controller';
import { PrismaCotizacionRepository } from '@/modules/quotations/infrastructure/persistance/prisma-cotizacion.repository';
import { COTIZACION_REPOSITORY } from '@/modules/quotations/domain/ports/cotizacion-repository.port';
import { CreateCotizacionUseCase } from '@/modules/quotations/application/use-cases/create-cotizacion.use-case';
import { CreateCotizacionForOfferedLeadHandler } from '@/modules/quotations/application/handlers/create-cotizacion-for-offered-lead.handler';
import { GetCotizacionByIdUseCase } from '@/modules/quotations/application/use-cases/get-cotizacion-by-id.use-case';
import { GetKpisCotizacionesUseCase } from '@/modules/quotations/application/use-cases/get-kpis-cotizaciones.use-case';
import { ListCotizacionesUseCase } from '@/modules/quotations/application/use-cases/list-cotizaciones.use-case';
import { UpdateCotizacionUseCase } from '@/modules/quotations/application/use-cases/update-cotizacion.use-case';
import { SendCotizacionUseCase } from '@/modules/quotations/application/use-cases/send-cotizacion.use-case';
import { AcceptCotizacionUseCase } from '@/modules/quotations/application/use-cases/accept-cotizacion.use-case';
import { RejectCotizacionUseCase } from '@/modules/quotations/application/use-cases/reject-cotizacion.use-case';
import { DeleteCotizacionUseCase } from '@/modules/quotations/application/use-cases/delete-cotizacion.use-case';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => LeadsModule),
        UsersModule,
        OrganizationsModule,
    ],
    controllers: [CotizacionController],
    providers: [
        PrismaCotizacionRepository,
        {
            provide: COTIZACION_REPOSITORY,
            useExisting: PrismaCotizacionRepository,
        },
        CreateCotizacionForOfferedLeadHandler,
        {
            provide: OFFERED_LEAD_HANDLER,
            useExisting: CreateCotizacionForOfferedLeadHandler,
        },
        CreateCotizacionUseCase,
        GetCotizacionByIdUseCase,
        GetKpisCotizacionesUseCase,
        ListCotizacionesUseCase,
        UpdateCotizacionUseCase,
        SendCotizacionUseCase,
        AcceptCotizacionUseCase,
        RejectCotizacionUseCase,
        DeleteCotizacionUseCase,
    ],
    exports: [OFFERED_LEAD_HANDLER],
})
export class CotizacionesModule {}
