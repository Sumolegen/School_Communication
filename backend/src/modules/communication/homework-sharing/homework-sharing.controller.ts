import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { CreateHomeworkDto, HomeworkQueryDto } from './homework-sharing.dto';
import { HomeworkSharingService } from './homework-sharing.service';

@Controller('homework')
export class HomeworkSharingController {
  constructor(private readonly homeworkService: HomeworkSharingService) {}

  @Get()
  list(@Query() query: HomeworkQueryDto, @CurrentUser() user: AuthUser) {
    return this.homeworkService.list(query, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN, RoleCode.TEACHER)
  @RequirePermissions('HOMEWORK_PUBLISH')
  @Post()
  create(@Body() dto: CreateHomeworkDto, @CurrentUser() user: AuthUser) {
    return this.homeworkService.create(dto, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN, RoleCode.TEACHER)
  @RequirePermissions('HOMEWORK_PUBLISH')
  @Delete(':id')
  remove(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.homeworkService.remove(id, user);
  }
}
