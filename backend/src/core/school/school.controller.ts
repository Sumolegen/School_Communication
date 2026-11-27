import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AllowCrossTenant } from '@shared/decorators/school-scoped.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Public } from '@shared/decorators/public.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { CreateSchoolDto, UpdateSchoolDto } from './school.dto';
import { SchoolService } from './school.service';

@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Public()
  @Get('config')
  getPublicConfig(@Query('schoolCode') schoolCode?: string, @CurrentUser() user?: AuthUser) {
    return this.schoolService.getPublicConfig(schoolCode, user);
  }

  @Roles(RoleCode.SUPER_ADMIN)
  @AllowCrossTenant()
  @Get('platform-health')
  getPlatformHealth() {
    return this.schoolService.getPlatformHealth();
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @AllowCrossTenant()
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.schoolService.findAll(user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN, RoleCode.TEACHER, RoleCode.PARENT, RoleCode.STUDENT)
  @Get(':id')
  findOne(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.schoolService.findOne(id, user);
  }

  @Roles(RoleCode.SUPER_ADMIN)
  @RequirePermissions('PLATFORM_SCHOOL_MANAGE')
  @AllowCrossTenant()
  @Post()
  create(@Body() dto: CreateSchoolDto) {
    return this.schoolService.create(dto);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('SCHOOL_BRANDING_MANAGE')
  @AllowCrossTenant()
  @Patch(':id')
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateSchoolDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schoolService.update(id, dto, user);
  }
}
