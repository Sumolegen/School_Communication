import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ClassUpdatesQueryDto, CreateClassUpdateDto } from './class-updates.dto';
import { ClassUpdatesService } from './class-updates.service';

@Controller('communication/class-updates')
export class ClassUpdatesController {
  constructor(private readonly classUpdatesService: ClassUpdatesService) {}

  @Get()
  list(@Query() query: ClassUpdatesQueryDto, @CurrentUser() user: AuthUser) {
    return this.classUpdatesService.list(query, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN, RoleCode.TEACHER)
  @RequirePermissions('CLASS_UPDATE_PUBLISH')
  @Post()
  create(@Body() dto: CreateClassUpdateDto, @CurrentUser() user: AuthUser) {
    return this.classUpdatesService.create(dto, user);
  }
}
