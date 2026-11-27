import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './academic-years.dto';
import { AcademicYearsService } from './academic-years.service';

@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly service: AcademicYearsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('schoolId') schoolId?: string) {
    return this.service.findAll(user, schoolId);
  }

  @Get('current')
  getCurrent(@CurrentUser() user: AuthUser, @Query('schoolId') schoolId?: string) {
    return this.service.getCurrent(user, schoolId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('ACADEMIC_YEAR_MANAGE')
  @Post()
  create(
    @Body() dto: CreateAcademicYearDto,
    @CurrentUser() user: AuthUser,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.service.create(dto, user, schoolId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('ACADEMIC_YEAR_MANAGE')
  @Patch(':id')
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateAcademicYearDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user);
  }
}
