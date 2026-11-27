import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateStaffAssignmentDto {
  @IsUUID()
  staffId!: string;

  @IsUUID()
  sectionId!: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsOptional()
  @IsBoolean()
  isClassTeacher?: boolean;
}
