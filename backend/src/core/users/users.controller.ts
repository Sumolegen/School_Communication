import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AllowCrossTenant } from '@shared/decorators/school-scoped.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { CreateUserDto, UpdateOwnProfileDto, UpdateUserDto, UsersQueryDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findOne(user.userId, user);
  }

  @Patch('me')
  updateMe(@Body() dto: UpdateOwnProfileDto, @CurrentUser() user: AuthUser) {
    return this.usersService.updateOwnProfile(dto, user);
  }

  @Post('me/deletion-request')
  requestDeletion(@CurrentUser() user: AuthUser) {
    return this.usersService.requestAccountDeletion(user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('USER_MANAGE')
  @AllowCrossTenant()
  @Get()
  findAll(@Query() query: UsersQueryDto, @CurrentUser() user: AuthUser) {
    return this.usersService.findAll(query, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('USER_MANAGE')
  @AllowCrossTenant()
  @Get(':id')
  findOne(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.findOne(id, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('USER_MANAGE')
  @AllowCrossTenant()
  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.create(dto, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('USER_MANAGE')
  @AllowCrossTenant()
  @Patch(':id')
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.update(id, dto, user);
  }
}
