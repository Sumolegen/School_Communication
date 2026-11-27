import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { BulkGradeScaleDto, GradeScaleDto } from './grades.dto';
import { GradesService } from './grades.service';

@Controller('academics/grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.gradesService.findAll(user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('EXAM_MANAGE')
  @Post()
  upsertOne(@Body() dto: GradeScaleDto, @CurrentUser() user: AuthUser) {
    return this.gradesService.upsertOne(dto, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('EXAM_MANAGE')
  @Put('bulk')
  replaceBulk(@Body() dto: BulkGradeScaleDto, @CurrentUser() user: AuthUser) {
    return this.gradesService.replaceBulk(dto, user);
  }
}
