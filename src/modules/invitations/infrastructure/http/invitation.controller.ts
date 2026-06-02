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
import type { Response } from 'express';

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
    @Post()
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
    @Get()
    async listInvitations(
        @CurrentUser() user: User,
        @Query('page', ParseIntPipe) page?: number,
        @Query('limit', ParseIntPipe) limit?: number,
        @Query('term') term?: string,
        @Query('estado') estado?: TokenStatus,
    ) {
        return this.listInvitationsUseCase.execute(page, limit, term, estado);
    }

    @Get('info/:token')
    async obtainInfo(@Param('token') token: string) {
        return this.obtainInfoUseCase.execute(token);
    }

    @Post('accept')
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
            secure: isProduction,
            sameSite: 'lax',
            path: '/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR)
    async revokeInvitation(@Param('id', ParseIntPipe) id: number) {
        return this.revokeInvitationUseCase.execute(id);
    }
}
