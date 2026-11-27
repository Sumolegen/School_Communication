import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { CircularsQueryDto, CreateCircularDto } from './circulars.dto';
import { CircularsService } from './circulars.service';

@Controller('circulars')
export class CircularsController {
  constructor(private readonly circularsService: CircularsService) {}

  @Get()
  list(@Query() query: CircularsQueryDto, @CurrentUser() user: AuthUser) {
    return this.circularsService.list(query, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN, RoleCode.TEACHER)
  @RequirePermissions('CIRCULAR_PUBLISH')
  @Post()
  create(@Body() dto: CreateCircularDto, @CurrentUser() user: AuthUser) {
    return this.circularsService.create(dto, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('CIRCULAR_PUBLISH')
  @Delete(':id')
  remove(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.circularsService.remove(id, user);
  }
}
