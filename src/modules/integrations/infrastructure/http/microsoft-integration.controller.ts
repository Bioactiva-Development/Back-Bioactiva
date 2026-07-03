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
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
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

@ApiTags('microsoft')
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
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Iniciar la conexión con una cuenta de Microsoft',
        description:
            'Genera la URL de autorización de Microsoft OAuth (firmada con un `state` que referencia al usuario autenticado y a `returnTo`) para redirigir al frontend.',
    })
    @ApiResponse({
        status: 200,
        description: 'URL de autorización de Microsoft generada',
        type: ConnectUrlDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async connect(
        @CurrentUser() user: User,
        @Query('returnTo') returnTo?: string,
    ): Promise<ConnectUrlDto> {
        return await this.connectUseCase.execute(user.id!, returnTo);
    }

    @SkipThrottle()
    @Get('callback')
    @ApiOperation({
        summary:
            'Callback de OAuth de Microsoft (uso interno, no invocar manualmente)',
        description:
            'Endpoint al que Microsoft redirige tras la autorización. Verifica el `state`, intercambia el `code` por tokens, persiste la integración y redirige al frontend (`FRONTEND_URL` + returnPath) con `?microsoft=connected` o `?microsoft=error`. No devuelve JSON: siempre responde con una redirección 302.',
    })
    @ApiResponse({
        status: 302,
        description:
            'Redirección al frontend con el resultado de la conexión en la query string',
    })
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
            return res.redirect(
                `${this.frontendUrl}${returnPath}?microsoft=error`,
            );
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
    @ApiBearerAuth()
    @ApiOperation({
        summary:
            'Consultar el estado de la conexión con Microsoft del usuario autenticado',
    })
    @ApiResponse({
        status: 200,
        description: 'Estado de la conexión',
        type: ConnectionStatusDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async status(@CurrentUser() user: User): Promise<ConnectionStatusDto> {
        return await this.statusUseCase.execute(user.id!);
    }

    @Delete('disconnect')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(200)
    @ApiOperation({
        summary: 'Desconectar la cuenta de Microsoft del usuario autenticado',
    })
    @ApiResponse({
        status: 200,
        description: 'Cuenta desconectada exitosamente',
        schema: { example: { ok: true } },
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 404,
        description:
            'No hay una integración de Microsoft asociada a este usuario',
    })
    async disconnect(@CurrentUser() user: User): Promise<{ ok: boolean }> {
        return await this.disconnectUseCase.execute(user.id!);
    }
}
