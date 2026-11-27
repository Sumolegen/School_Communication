import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PriorityLevel, TargetScope } from '@shared/enums';

export class CreateAlertDto {
  @IsString()
  title!: string;

  @IsString()
  body!: string;

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
