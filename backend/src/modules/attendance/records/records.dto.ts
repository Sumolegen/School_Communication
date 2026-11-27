import { IsArray, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@shared/enums';
import { IsDateOnlyString } from '@shared/validators/is-date-string-only.validator';

export class StudentAttendanceEntryDto {
  @IsUUID()
  studentId!: string;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkAttendanceDto {
  @IsUUID()
  sectionId!: string;

  @IsDateOnlyString()
  date!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceEntryDto)
  records!: StudentAttendanceEntryDto[];
}
