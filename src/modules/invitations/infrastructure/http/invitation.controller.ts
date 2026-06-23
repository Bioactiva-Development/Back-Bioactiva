import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/infrastructure/jwt/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/infrastructure/jwt/guards/roles.guard';
import { AcceptInvitationUseCase } from '@/modules/invitations/application/use-cases/accept-invitation.use-case';
import { CreateInvitationUseCase } from '@/modules/invitations/application/use-cases/create-invitation.use-case';
import { ListInvitationsUseCase } from '@/modules/invitations/application/use-cases/list-invitations.use-case';
import { ObtainInfoUseCase } from '@/modules/invitations/application/use-cases/obtain-info-use-case';
import { RevokeInvitationUseCase } from '@/modules/invitations/application/use-cases/revoke-invitation.use-case';
import { AuthResponseDto } from '@/modules/auth/application/dto/auth-response.dto';
import { REFRESH_TOKEN_COOKIE_NAME } from '@/modules/auth/infrastructure/http/cookie-names';
import { AcceptInvitationDto } from '@/modules/invitations/infrastructure/http/dto/accept-invitation.dto.htpp';
import { PaginatedInvitationResponseDto } from '@/modules/invitations/infrastructure/http/dto/paginated-invitation-response.dto';
import { CreateInvitationDto } from '@/modules/invitations/infrastructure/http/dto/create-invitation.dto.http';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationController {
    constructor(
        private readonly createInvitationUseCase: CreateInvitationUseCase,
        private readonly acceptInvitationUseCase: AcceptInvitationUseCase,
        private readonly revokeInvitationUseCase: RevokeInvitationUseCase,
        private readonly obtainInfoUseCase: ObtainInfoUseCase,
        private readonly listInvitationsUseCase: ListInvitationsUseCase,
    ) {}
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR)
    @ApiBearerAuth()
    @Post()
    @ApiOperation({
        summary: 'Crear una invitación (solo ADMINISTRADOR)',
    })
    @ApiResponse({
        status: 201,
        description: 'Invitación creada y correo encolado',
        schema: { example: { ok: true } },
    })
    @ApiResponse({
        status: 400,
        description:
            'Dominio no permitido o ya existe una invitación pendiente para el correo',
    })
    @ApiResponse({ status: 401, description: 'No autenticado o no autorizado' })
    @ApiResponse({
        status: 403,
        description: 'El usuario no tiene rol ADMINISTRADOR',
    })
    async createInvitation(
        @CurrentUser() user: User,
        @Body() invitationData: CreateInvitationDto,
    ) {
        return this.createInvitationUseCase.execute(
            user,
            invitationData.correo,
            invitationData.rol,
        );
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR)
    @ApiBearerAuth()
    @Get()
    @ApiOperation({
        summary: 'Listar invitaciones con filtros (solo ADMINISTRADOR)',
    })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({
        name: 'term',
        required: false,
        type: String,
        description: 'Búsqueda por correo',
    })
    @ApiQuery({ name: 'estado', required: false, enum: TokenStatus })
    @ApiResponse({
        status: 200,
        description: 'Listado paginado de invitaciones',
        type: PaginatedInvitationResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 403,
        description: 'El usuario no tiene rol ADMINISTRADOR',
    })
    async listInvitations(
        @CurrentUser() user: User,
        @Query('page', ParseIntPipe) page?: number,
        @Query('limit', ParseIntPipe) limit?: number,
        @Query('term') term?: string,
        @Query('estado') estado?: TokenStatus,
    ): Promise<PaginatedInvitationResponseDto> {
        const resolvedPage = page ?? 1;
        const resolvedLimit = limit ?? 10;
        const { data, total } = await this.listInvitationsUseCase.execute(
            resolvedPage,
            resolvedLimit,
            term,
            estado,
        );
        return new PaginatedInvitationResponseDto(
            data,
            total,
            resolvedPage,
            resolvedLimit,
        );
    }

    @Get('info/:token')
    @ApiOperation({
        summary: 'Obtener información pública de una invitación por token',
    })
    @ApiResponse({
        status: 200,
        description: 'Información de la invitación (correo enmascarado)',
        schema: {
            example: {
                correo: 'j***n@bioactiva.com',
                expired: false,
                accepted: false,
            },
        },
    })
    @ApiResponse({ status: 404, description: 'Token no encontrado' })
    async obtainInfo(@Param('token') token: string) {
        return this.obtainInfoUseCase.execute(token);
    }

    @Post('accept')
    @ApiOperation({
        summary: 'Aceptar una invitación y activar la cuenta del usuario',
    })
    @ApiResponse({
        status: 201,
        description:
            'Invitación aceptada, usuario activado y sesión iniciada (devuelve access token y setea la cookie de refresh)',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: 400,
        description:
            'Las contraseñas no coinciden, el token es inválido o el dominio no está permitido',
    })
    @ApiResponse({
        status: 409,
        description: 'La invitación está expirada o ya fue consumida',
    })
    async acceptInvitation(
        @Body() body: AcceptInvitationDto,
        @Res({ passthrough: true }) response: Response,
    ): Promise<AuthResponseDto> {
        if (body.password !== body.confirmPassword) {
            throw new BadRequestException('Las contraseñas no coinciden');
        }
        const tokenPair = await this.acceptInvitationUseCase.execute(
            body.token,
            body.password,
            body.nombres,
            body.apellidos,
        );

        this.setRefreshTokenCookie(response, tokenPair.refreshToken);

        return AuthResponseDto.fromTokenPair(
            tokenPair.accessToken,
            tokenPair.accessTokenExpiresIn,
        );
    }

    private setRefreshTokenCookie(response: Response, refreshToken: string) {
        const isProduction = process.env.NODE_ENV === 'production';

        response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
            httpOnly: true,
            // Misma política que el login: en prod el front es cross-site, así
            // que la cookie necesita SameSite=None + Secure (HTTPS). En dev se
            // mantiene Lax + no-secure. Requiere NODE_ENV=production en prod.
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            path: '/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Revocar una invitación (solo ADMINISTRADOR)' })
    @ApiResponse({ status: 200, description: 'Invitación revocada' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 403,
        description: 'El usuario no tiene rol ADMINISTRADOR',
    })
    @ApiResponse({ status: 404, description: 'Invitación no encontrada' })
    async revokeInvitation(@Param('id', ParseIntPipe) id: number) {
        return this.revokeInvitationUseCase.execute(id);
    }
}
