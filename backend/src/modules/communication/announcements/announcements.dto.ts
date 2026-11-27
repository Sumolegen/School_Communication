import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { AnnouncementKind, PriorityLevel, TargetScope } from '@shared/enums';

export class CreateAnnouncementDto {
  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsEnum(AnnouncementKind)
  kind?: AnnouncementKind;

  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

  @IsOptional()
  @IsEnum(TargetScope)
  targetScope?: TargetScope;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sectionIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  studentIds?: string[];

  @IsOptional()
  @IsUUID()
  attachmentFileId?: string;
}

export class AnnouncementsQueryDto {
  @IsOptional()
  @IsEnum(AnnouncementKind)
  kind?: AnnouncementKind;

  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

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
