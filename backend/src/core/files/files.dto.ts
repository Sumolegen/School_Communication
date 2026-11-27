import { IsEnum, IsOptional } from 'class-validator';
import { FileCategory } from '@shared/enums';

export class UploadFileDto {
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;
}
