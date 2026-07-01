import {
    Controller,
    Get,
    Delete,
    Query,
    UseGuards,
    HttpCode,
    Res,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
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
import { verifyOAuthState } from '@/modules/integrations/application/oauth-state';

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

    @SkipThrottle()
    @Get('callback')
    async callback(
        @Query() query: OAuthCallbackQueryDto,
        @Res() res: Response,
    ): Promise<void> {
        const userId = verifyOAuthState(query.state);
        if (!userId) {
            return res.redirect(
                `${this.frontendUrl}${DEFAULT_RETURN_PATH}?microsoft=error`,
            );
        }
        const returnPath = this.resolveReturnPath(query.state.split(':')[2]);
        try {
            await this.callbackUseCase.execute(query.code, userId);
            return res.redirect(
                `${this.frontendUrl}${returnPath}?microsoft=connected`,
            );
        } catch {
            return res.redirect(`${this.frontendUrl}${returnPath}?microsoft=error`);
        }
    }

    private get frontendUrl(): string {
        return (
            process.env.FRONTEND_URL?.trim().replace(/\/$/, '') ||
            'http://localhost:5173'
        );
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
