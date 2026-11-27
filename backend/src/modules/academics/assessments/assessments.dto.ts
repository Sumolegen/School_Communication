import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { IsDateOnlyString } from '@shared/validators/is-date-string-only.validator';

export class CreateAssessmentDto {
  @IsUUID()
  examTermId!: string;

  @IsUUID()
  sectionId!: string;

  @IsUUID()
  subjectId!: string;

  @IsString()
  title!: string;

  @IsNumber()
  @Min(1)
  maxMarks!: number;

  @IsNumber()
  @Min(0)
  passMarks!: number;

  @IsDateOnlyString()
  examDate!: string;
}

export class AssessmentsQueryDto {
  @IsOptional()
  @IsUUID()
  examTermId?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;
}
