import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { CreateSubjectDto, UpdateSubjectDto } from './subjects.dto';
import { SubjectsService } from './subjects.service';

@Controller('academics/subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('schoolId') schoolId?: string) {
    return this.subjectsService.findAll(user, schoolId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('SUBJECT_MANAGE')
  @Post()
  create(
    @Body() dto: CreateSubjectDto,
    @CurrentUser() user: AuthUser,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.subjectsService.create(dto, user, schoolId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('SUBJECT_MANAGE')
  @Patch(':id')
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateSubjectDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subjectsService.update(id, dto, user);
  }
}
