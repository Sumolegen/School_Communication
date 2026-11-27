import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsDateOnlyString } from '@shared/validators/is-date-string-only.validator';

export class PhotoEntryDto {
  @IsUUID()
  fileId!: string;

  @IsOptional()
  @IsString()
  caption?: string;
}

export class CreatePhotoAlbumDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateOnlyString()
  eventDate!: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhotoEntryDto)
  photos?: PhotoEntryDto[];
}

export class AddPhotosToAlbumDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhotoEntryDto)
  photos!: PhotoEntryDto[];
}
