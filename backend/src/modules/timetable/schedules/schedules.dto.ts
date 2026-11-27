import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '@shared/enums';

export class TimetableItemDto {
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @IsInt()
  @Min(1)
  @Max(12)
  periodNo!: number;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsUUID()
  subjectId!: string;

  @IsUUID()
  teacherStaffId!: string;
}

export class CreateTimetableEntryDto extends TimetableItemDto {
  @IsUUID()
  sectionId!: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}

export class BulkUpsertTimetableDto {
  @IsUUID()
  sectionId!: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimetableItemDto)
  entries!: TimetableItemDto[];
}
