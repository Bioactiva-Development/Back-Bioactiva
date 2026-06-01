import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
import { ListUsersQueryDto } from '@/modules/users/infrastructure/http/dtos/list-users-query.dto.http';
import { UserResponseDto } from '@/modules/users/infrastructure/http/dtos/user-response.dto';
import { PaginatedUserResponseDto } from '@/modules/users/infrastructure/http/dtos/paginated-user-response.dto';
import { ListUsersDto } from '@/modules/users/application/dto/list-users.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMINISTRADOR)
@Controller('users')
export class UserController {
    constructor(private readonly getAllUsersUseCase: GetAllUsersUseCase) {}

    @Get()
    @ApiOperation({
        summary: 'Listar usuarios',
        description:
            'Obtiene un listado paginado de usuarios con filtros opcionales. Solo accesible para administradores.',
    })
    @ApiResponse({
        status: 200,
        description: 'Listado paginado de usuarios',
        type: PaginatedUserResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 403,
        description: 'No autorizado — se requiere rol ADMINISTRADOR',
    })
    async findAll(
        @Query() query: ListUsersQueryDto,
    ): Promise<PaginatedUserResponseDto> {
        const dto = new ListUsersDto(
            query.search,
            query.role,
            query.estado,
            query.page,
            query.limit,
        );
        const { data, total } = await this.getAllUsersUseCase.execute(dto);
        const responseData = data.map((user) => new UserResponseDto(user));
        return new PaginatedUserResponseDto(
            responseData,
            total,
            dto.page,
            dto.limit,
        );
    }
}
