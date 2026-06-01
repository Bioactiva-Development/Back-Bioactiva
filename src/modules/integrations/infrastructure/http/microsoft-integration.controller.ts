import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Query,
    UseGuards,
    HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { User } from '@/modules/users/domain/entities/user';
import { ConnectMicrosoftAccountUseCase } from '@/modules/integrations/application/use-cases/connect-microsoft-account.use-case';
import { MicrosoftOAuthCallbackUseCase } from '@/modules/integrations/application/use-cases/microsoft-oauth-callback.use-case';
import { GetMicrosoftConnectionStatusUseCase } from '@/modules/integrations/application/use-cases/get-microsoft-connection-status.use-case';
import { DisconnectMicrosoftAccountUseCase } from '@/modules/integrations/application/use-cases/disconnect-microsoft-account.use-case';
import { DirectConnectUseCase } from '@/modules/integrations/application/use-cases/direct-connect.use-case';
import { OAuthCallbackQueryDto } from '@/modules/integrations/infrastructure/http/dto/oauth-callback-query.dto';
import { ConnectUrlDto } from '@/modules/integrations/application/dto/connect-url.dto';
import { ConnectionStatusDto } from '@/modules/integrations/application/dto/connection-status.dto';
import { DirectConnectDto } from '@/modules/integrations/application/dto/direct-connect.dto';
import { MicrosoftIntegration } from '@/modules/integrations/domain/entities/microsoft-integration';

@Controller('microsoft')
export class MicrosoftIntegrationController {
    constructor(
        private readonly connectUseCase: ConnectMicrosoftAccountUseCase,
        private readonly callbackUseCase: MicrosoftOAuthCallbackUseCase,
        private readonly statusUseCase: GetMicrosoftConnectionStatusUseCase,
        private readonly disconnectUseCase: DisconnectMicrosoftAccountUseCase,
        private readonly directConnectUseCase: DirectConnectUseCase,
    ) {}

    @Get('connect')
    @UseGuards(JwtAuthGuard)
    async connect(@CurrentUser() user: User): Promise<ConnectUrlDto> {
        return await this.connectUseCase.execute(user.id!);
    }

    @Get('callback')
    async callback(
        @Query() query: OAuthCallbackQueryDto,
    ): Promise<MicrosoftIntegration> {
        const stateParts = query.state.split(':');
        const userId = parseInt(stateParts[0], 10);
        return await this.callbackUseCase.execute(query.code, userId);
    }

    @Get('status')
    @UseGuards(JwtAuthGuard)
    async status(@CurrentUser() user: User): Promise<ConnectionStatusDto> {
        return await this.statusUseCase.execute(user.id!);
    }

    @Delete('disconnect')
    @UseGuards(JwtAuthGuard)
    @HttpCode(200)
    async disconnect(@CurrentUser() user: User): Promise<{ ok: boolean }> {
        return await this.disconnectUseCase.execute(user.id!);
    }

    @Post('connect/direct')
    @UseGuards(JwtAuthGuard)
    async connectDirect(
        @CurrentUser() user: User,
        @Body() dto: DirectConnectDto,
    ): Promise<MicrosoftIntegration> {
        return await this.directConnectUseCase.execute(user.id!, dto);
    }
}
