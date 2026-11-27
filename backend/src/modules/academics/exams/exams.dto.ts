import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ExamTermType } from '@shared/enums';
import { IsDateOnlyString } from '@shared/validators/is-date-string-only.validator';

export class CreateExamTermDto {
  @IsString()
  name!: string;

  @IsEnum(ExamTermType)
  termType!: ExamTermType;

  @IsDateOnlyString()
  startDate!: string;

  @IsDateOnlyString()
  endDate!: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}
