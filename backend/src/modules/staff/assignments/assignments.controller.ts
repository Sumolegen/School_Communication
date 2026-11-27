import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { CreateStaffAssignmentDto } from './assignments.dto';
import { AssignmentsService } from './assignments.service';

@Controller('staff/assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('me')
  getMyAssignments(@CurrentUser() user: AuthUser) {
    return this.assignmentsService.getMyAssignments(user);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('staffId') staffId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.assignmentsService.listAssignments(user, staffId, sectionId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('STAFF_ASSIGN')
  @Post()
  create(@Body() dto: CreateStaffAssignmentDto, @CurrentUser() user: AuthUser) {
    return this.assignmentsService.create(dto, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('STAFF_ASSIGN')
  @Delete(':id')
  remove(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.assignmentsService.remove(id, user);
  }
}
