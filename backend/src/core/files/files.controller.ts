import { Body, Controller, Get, Param, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { FileCategory } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { UploadFileDto } from './files.dto';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: AuthUser,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.filesService.uploadFile(file, dto.category ?? FileCategory.OTHER, user, schoolId);
  }

  @Get(':id/download')
  async downloadFile(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const { asset, filePath } = await this.filesService.getFileForDownload(id, user);
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(asset.originalName)}"`);
    fs.createReadStream(filePath).pipe(res);
  }
}
