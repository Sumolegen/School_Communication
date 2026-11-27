import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { CreateExamTermDto } from './exams.dto';
import { ExamsService } from './exams.service';

@Controller('academics/exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('academicYearId') academicYearId?: string) {
    return this.examsService.findAll(user, academicYearId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('EXAM_MANAGE')
  @Post()
  create(@Body() dto: CreateExamTermDto, @CurrentUser() user: AuthUser) {
    return this.examsService.create(dto, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('EXAM_MANAGE')
  @Delete(':id')
  remove(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.examsService.remove(id, user);
  }
}
