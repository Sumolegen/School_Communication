import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { CreateAcademicUpdateDto } from './academic-updates.dto';
import { AcademicUpdatesService } from './academic-updates.service';

@Controller('academics/academic-updates')
export class AcademicUpdatesController {
  constructor(private readonly service: AcademicUpdatesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('studentId') studentId?: string) {
    return this.service.list(user, studentId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN, RoleCode.TEACHER)
  @RequirePermissions('MARKS_ENTER')
  @Post()
  create(@Body() dto: CreateAcademicUpdateDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }
}
