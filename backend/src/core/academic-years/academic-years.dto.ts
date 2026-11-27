import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsDateOnlyString } from '@shared/validators/is-date-string-only.validator';

export class CreateAcademicYearDto {
  @IsString()
  @MaxLength(40)
  name!: string;

  @IsDateOnlyString()
  startDate!: string;

  @IsDateOnlyString()
  endDate!: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}

export class UpdateAcademicYearDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string;

  @IsOptional()
  @IsDateOnlyString()
  startDate?: string;

  @IsOptional()
  @IsDateOnlyString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}
