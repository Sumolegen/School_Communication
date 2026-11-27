import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateClassUpdateDto {
  @IsUUID()
  sectionId!: string;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsUUID()
  attachmentFileId?: string;
}

export class ClassUpdatesQueryDto {
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
