import { IsArray, IsInt, IsOptional, IsString, IsUrl, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsDateOnlyString } from '@shared/validators/is-date-string-only.validator';

export class HomeworkExternalLinkDto {
  @IsString()
  label!: string;

  @IsUrl()
  url!: string;
}

export class CreateHomeworkDto {
  @IsUUID()
  sectionId!: string;

  @IsUUID()
  subjectId!: string;

  @IsString()
  title!: string;

  @IsString()
  instructions!: string;

  @IsOptional()
  @IsDateOnlyString()
  assignedDate?: string;

  @IsDateOnlyString()
  dueDate!: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attachmentFileIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HomeworkExternalLinkDto)
  externalLinks?: HomeworkExternalLinkDto[];
}

export class HomeworkQueryDto {
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsUUID()
  class_id?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsDateOnlyString()
  date?: string;

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
