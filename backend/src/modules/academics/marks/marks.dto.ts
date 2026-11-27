import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentMarkEntryDto {
  @IsUUID()
  studentId!: string;

  @IsNumber()
  @Min(0)
  marksObtained!: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkEnterMarksDto {
  @IsUUID()
  assessmentId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentMarkEntryDto)
  entries!: StudentMarkEntryDto[];
}
