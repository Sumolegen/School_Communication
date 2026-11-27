import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { CreateStudentDto, LinkParentDto, StudentsQueryDto, UpdateStudentDto } from './profiles.dto';
import { ProfilesService } from './profiles.service';

@Controller('students/profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  findAll(@Query() query: StudentsQueryDto, @CurrentUser() user: AuthUser) {
    return this.profilesService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.profilesService.findOne(id, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('STUDENT_MANAGE')
  @Post()
  create(
    @Body() dto: CreateStudentDto,
    @CurrentUser() user: AuthUser,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.profilesService.create(dto, user, schoolId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('STUDENT_MANAGE')
  @Patch(':id')
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.profilesService.update(id, dto, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('STUDENT_MANAGE')
  @Post(':id/parents')
  linkParent(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: LinkParentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.profilesService.linkParent(id, dto, user);
  }
}
