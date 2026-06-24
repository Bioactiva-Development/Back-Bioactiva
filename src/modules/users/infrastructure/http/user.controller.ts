import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/infrastructure/jwt/guards/roles.guard';
import { Roles } from '@/modules/auth/infrastructure/jwt/decorators/roles.decorator';
import { UserRole } from '@/shared/domain/enums/rol';
import { GetAllUsersUseCase } from '@/modules/users/application/use-cases/get-all-users.use-case';
import { GetAssignableUsersUseCase } from '@/modules/users/application/use-cases/get-assignable-users.use-case';
import { DisableUserUseCase } from '@/modules/users/application/use-cases/disable-user.use-case';
import { EnableUserUseCase } from '@/modules/users/application/use-cases/enable-user.use-case';
import { ChangeUserRoleUseCase } from '@/modules/users/application/use-cases/change-user-role.use-case';
import { ListUsersQueryDto } from '@/modules/users/infrastructure/http/dtos/list-users-query.dto.http';
import { RevokeUserParamsDto } from '@/modules/users/infrastructure/http/dtos/revoke-user-params.dto.http';
import { ChangeRoleDto } from '@/modules/users/infrastructure/http/dtos/change-role.dto.http';
import { UserResponseDto } from '@/modules/users/infrastructure/http/dtos/user-response.dto';
import { UserMapper } from '@/modules/users/infrastructure/mappers/user.mapper';
import { PaginatedUserResponseDto } from '@/modules/users/infrastructure/http/dtos/paginated-user-response.dto';
import { AssignableUserResponseDto } from '@/modules/users/infrastructure/http/dtos/assignable-user-response.dto';
import { ListUsersDto } from '@/modules/users/application/dto/list-users.dto';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { User } from '@/modules/users/domain/entities/user';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
    constructor(
        private readonly getAllUsersUseCase: GetAllUsersUseCase,
        private readonly getAssignableUsersUseCase: GetAssignableUsersUseCase,
        private readonly disableUserUseCase: DisableUserUseCase,
        private readonly enableUserUseCase: EnableUserUseCase,
        private readonly changeUserRoleUseCase: ChangeUserRoleUseCase,
    ) {}

    @Get()
    @ApiOperation({
        summary: 'Listar usuarios',
        description:
            'Obtiene un listado paginado de usuarios con filtros opcionales. Un administrador ve a todos los usuarios; un trabajador solo ve a otros trabajadores.',
    })
    @ApiResponse({
        status: 200,
        description: 'Listado paginado de usuarios',
        type: PaginatedUserResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async findAll(
        @Query() query: ListUsersQueryDto,
        @CurrentUser() currentUser: User,
    ): Promise<PaginatedUserResponseDto> {
        const dto = new ListUsersDto(
            query.search,
            query.role,
            query.estado,
            query.page,
            query.limit,
        );
        const { data, total } = await this.getAllUsersUseCase.execute(
            dto,
            currentUser.role,
        );
        const responseData = data.map((user) => new UserResponseDto(user));
        return new PaginatedUserResponseDto(
            responseData,
            total,
            dto.page,
            dto.limit,
        );
    }

    @Get('assignable')
    @ApiOperation({
        summary: 'Listar usuarios habilitados para asignación',
        description:
            'Devuelve todos los usuarios en estado Habilitado para poblar selectores ' +
            '(p. ej. el encargado de un lead). Accesible para cualquier usuario ' +
            'autenticado, sin importar el rol.',
    })
    @ApiResponse({
        status: 200,
        description: 'Usuarios habilitados',
        type: [AssignableUserResponseDto],
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async findAssignable(): Promise<AssignableUserResponseDto[]> {
        const users = await this.getAssignableUsersUseCase.execute();
        return users.map((user) => new AssignableUserResponseDto(user));
    }

    @Patch(':id/disable')
    @Roles(UserRole.ADMINISTRADOR)
    @HttpCode(204)
    @ApiOperation({
        summary: 'Deshabilitar usuario',
        description:
            'Suspende el acceso de un usuario al sistema. Solo accesible para administradores. Un administrador no puede deshabilitarse a sí mismo.',
    })
    @ApiResponse({
        status: 204,
        description: 'Usuario deshabilitado exitosamente',
    })
    @ApiResponse({
        status: 409,
        description:
            'No se puede deshabilitar la propia cuenta o el usuario ya está deshabilitado',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 403,
        description: 'No autorizado — se requiere rol ADMINISTRADOR',
    })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    async disable(
        @Param() params: RevokeUserParamsDto,
        @CurrentUser() currentUser: User,
    ): Promise<void> {
        await this.disableUserUseCase.execute(params.id, currentUser.id!);
    }

    @Patch(':id/enable')
    @Roles(UserRole.ADMINISTRADOR)
    @HttpCode(204)
    @ApiOperation({
        summary: 'Habilitar usuario',
        description:
            'Reactiva el acceso de un usuario al sistema. Solo accesible para administradores.',
    })
    @ApiResponse({
        status: 204,
        description: 'Usuario habilitado exitosamente',
    })
    @ApiResponse({ status: 409, description: 'El usuario ya está habilitado' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 403,
        description: 'No autorizado — se requiere rol ADMINISTRADOR',
    })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    async enable(@Param() params: RevokeUserParamsDto): Promise<void> {
        await this.enableUserUseCase.execute(params.id);
    }

    @Patch(':id/role')
    @Roles(UserRole.ADMINISTRADOR)
    @ApiOperation({
        summary: 'Cambiar el rol de un usuario',
        description:
            'Asigna un nuevo rol a un usuario. Solo accesible para administradores. Un administrador no puede cambiar su propio rol. Al cambiar el rol se cierra la sesión vigente del usuario para que el nuevo rol surta efecto.',
    })
    @ApiResponse({
        status: 200,
        description: 'Rol actualizado exitosamente',
        type: UserResponseDto,
    })
    @ApiResponse({
        status: 409,
        description: 'Un administrador no puede cambiar su propio rol',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 403,
        description: 'No autorizado — se requiere rol ADMINISTRADOR',
    })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    async changeRole(
        @Param() params: RevokeUserParamsDto,
        @Body() body: ChangeRoleDto,
        @CurrentUser() currentUser: User,
    ): Promise<UserResponseDto> {
        const updated = await this.changeUserRoleUseCase.execute(
            params.id,
            UserMapper.mapRole(body.rol),
            currentUser.id!,
        );
        return new UserResponseDto(updated);
    }
}
