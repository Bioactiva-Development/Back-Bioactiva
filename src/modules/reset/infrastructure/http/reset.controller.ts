import {
    Controller,
    Get,
    ImATeapotException,
    Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResetService } from '@/modules/reset/application/reset.service';

@ApiTags('reset')
@Controller('reset')
export class ResetController {
    constructor(private readonly resetService: ResetService) {}

    @Get()
    @ApiQuery({
        name: 'confirm',
        required: true,
        type: Boolean,
        description: 'Confirmación obligatoria para reiniciar la base de datos',
    })
    async resetDatabase(
        @Query('confirm') confirm: string,
    ): Promise<{ message: string }> {
        if (confirm !== 'true') {
            throw new ImATeapotException(
                'Debe proporcionar ?confirm=true para reiniciar la base de datos',
            );
        }

        await this.resetService.resetDatabase();
        return { message: 'Base de datos reiniciada exitosamente' };
    }
}
