import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/infrastructure/jwt/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/infrastructure/jwt/guards/roles.guard';
import { AcceptInvitationUseCase } from '@/modules/invitations/application/use-cases/accept-invitation.use-case';
import { CreateInvitationUseCase } from '@/modules/invitations/application/use-cases/create-invitation.use-case';
import { ListInvitationsUseCase } from '@/modules/invitations/application/use-cases/list-invitations.use-case';
import { ObtainInfoUseCase } from '@/modules/invitations/application/use-cases/obtain-info-use-case';
import { RevokeInvitationUseCase } from '@/modules/invitations/application/use-cases/revoke-invitation.use-case';
import { CreateInvitationDto } from '@/modules/invitations/infrastructure/http/dto/create-invitation.dto.http';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

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
        @Query() page?: number,
        @Query() limit?: number,
        @Query() term?: string,
        @Query() estado?: TokenStatus,
    ) {
        return this.listInvitationsUseCase.execute(page, limit, term, estado);
    }

    @Get('info/:token')
    async obtainInfo(@Query('token') token: string) {
        return this.obtainInfoUseCase.execute(token);
    }
}
