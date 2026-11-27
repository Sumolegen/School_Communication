import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { CreateClassDto, CreateSectionDto, UpdateSectionDto } from './classes.dto';
import { ClassesService } from './classes.service';

@Controller('students/classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  listClasses(@CurrentUser() user: AuthUser, @Query('schoolId') schoolId?: string) {
    return this.classesService.listClasses(user, schoolId);
  }

  @Get('sections')
  listSections(
    @CurrentUser() user: AuthUser,
    @Query('academicYearId') academicYearId?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.classesService.listSections(user, academicYearId, schoolId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('CLASS_MANAGE')
  @Post()
  createClass(
    @Body() dto: CreateClassDto,
    @CurrentUser() user: AuthUser,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.classesService.createClass(dto, user, schoolId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('CLASS_MANAGE')
  @Post('sections')
  createSection(
    @Body() dto: CreateSectionDto,
    @CurrentUser() user: AuthUser,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.classesService.createSection(dto, user, schoolId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('CLASS_MANAGE')
  @Patch('sections/:id')
  updateSection(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateSectionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classesService.updateSection(id, dto, user);
  }
}
