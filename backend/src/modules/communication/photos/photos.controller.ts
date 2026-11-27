import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { AddPhotosToAlbumDto, CreatePhotoAlbumDto } from './photos.dto';
import { PhotosService } from './photos.service';

@Controller('gallery')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Get()
  listAlbums(@CurrentUser() user: AuthUser, @Query('sectionId') sectionId?: string) {
    return this.photosService.listAlbums(user, sectionId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN, RoleCode.TEACHER)
  @RequirePermissions('PHOTO_UPLOAD')
  @Post()
  createAlbum(@Body() dto: CreatePhotoAlbumDto, @CurrentUser() user: AuthUser) {
    return this.photosService.createAlbum(dto, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN, RoleCode.TEACHER)
  @RequirePermissions('PHOTO_UPLOAD')
  @Post(':id/photos')
  addPhotos(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: AddPhotosToAlbumDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.photosService.addPhotos(id, dto, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN, RoleCode.TEACHER)
  @RequirePermissions('PHOTO_UPLOAD')
  @Delete(':id')
  removeAlbum(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.photosService.removeAlbum(id, user);
  }
}
