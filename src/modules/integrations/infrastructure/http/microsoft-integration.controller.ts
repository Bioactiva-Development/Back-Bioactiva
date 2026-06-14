import {
    Controller,
    Get,
    Delete,
    Query,
    UseGuards,
    HttpCode,
    Res,
} from '@nestjs/common';
import { type Response } from 'express';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { User } from '@/modules/users/domain/entities/user';
import { ConnectMicrosoftAccountUseCase } from '@/modules/integrations/application/use-cases/connect-microsoft-account.use-case';
import { MicrosoftOAuthCallbackUseCase } from '@/modules/integrations/application/use-cases/microsoft-oauth-callback.use-case';
import { GetMicrosoftConnectionStatusUseCase } from '@/modules/integrations/application/use-cases/get-microsoft-connection-status.use-case';
import { DisconnectMicrosoftAccountUseCase } from '@/modules/integrations/application/use-cases/disconnect-microsoft-account.use-case';
import { OAuthCallbackQueryDto } from '@/modules/integrations/infrastructure/http/dto/oauth-callback-query.dto';
import { ConnectUrlDto } from '@/modules/integrations/application/dto/connect-url.dto';
import { ConnectionStatusDto } from '@/modules/integrations/application/dto/connection-status.dto';
import {
    DEFAULT_RETURN_PATH,
    sanitizeReturnPath,
} from '@/modules/integrations/application/microsoft-return-path';

const FRONTEND_URL =
    process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3120';

@Controller('microsoft')
export class MicrosoftIntegrationController {
    constructor(
        private readonly connectUseCase: ConnectMicrosoftAccountUseCase,
        private readonly callbackUseCase: MicrosoftOAuthCallbackUseCase,
        private readonly statusUseCase: GetMicrosoftConnectionStatusUseCase,
        private readonly disconnectUseCase: DisconnectMicrosoftAccountUseCase,
    ) {}

    @Get('connect')
    @UseGuards(JwtAuthGuard)
    async connect(
        @CurrentUser() user: User,
        @Query('returnTo') returnTo?: string,
    ): Promise<ConnectUrlDto> {
        return await this.connectUseCase.execute(user.id!, returnTo);
    }

    @Get('callback')
    async callback(
        @Query() query: OAuthCallbackQueryDto,
        @Res() res: Response,
    ): Promise<void> {
        const stateParts = query.state.split(':');
        const userId = Number.parseInt(stateParts[0], 10);
        const returnPath = this.resolveReturnPath(stateParts[2]);
        try {
            await this.callbackUseCase.execute(query.code, userId);
            return res.redirect(
                `${FRONTEND_URL}${returnPath}?microsoft=connected`,
            );
        } catch {
            return res.redirect(`${FRONTEND_URL}${returnPath}?microsoft=error`);
        }
    }

    /** Reconstruye la ruta de retorno guardada en el `state` (saneada). */
    private resolveReturnPath(encoded?: string): string {
        if (!encoded) {
            return DEFAULT_RETURN_PATH;
        }
        try {
            return sanitizeReturnPath(decodeURIComponent(encoded));
        } catch {
            return DEFAULT_RETURN_PATH;
        }
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
}
