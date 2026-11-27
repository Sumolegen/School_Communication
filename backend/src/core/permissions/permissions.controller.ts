import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { UpsertSchoolPermissionOverrideDto } from './permissions.dto';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @Get()
  findAllCatalog() {
    return this.permissionsService.findAllCatalog();
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @Get('school-overrides')
  getSchoolOverrides(@CurrentUser() user: AuthUser, @Query('schoolId') schoolId?: string) {
    return this.permissionsService.getSchoolOverrides(user, schoolId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('PERMISSION_MANAGE')
  @Put('school-overrides')
  upsertOverride(
    @Body() dto: UpsertSchoolPermissionOverrideDto,
    @CurrentUser() user: AuthUser,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.permissionsService.upsertSchoolOverride(dto, user, schoolId);
  }
}
