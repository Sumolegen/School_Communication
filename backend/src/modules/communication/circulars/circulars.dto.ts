import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { TargetScope } from '@shared/enums';
import { IsDateOnlyString } from '@shared/validators/is-date-string-only.validator';

export class CreateCircularDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateOnlyString()
  circularDate!: string;

  @IsUUID()
  fileId!: string;

  @IsOptional()
  @IsEnum(TargetScope)
  targetScope?: TargetScope;

  @IsOptional()
  @IsUUID()
  sectionId?: string;
}

export class CircularsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateOnlyString()
  fromDate?: string;

  @IsOptional()
  @IsDateOnlyString()
  toDate?: string;

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
