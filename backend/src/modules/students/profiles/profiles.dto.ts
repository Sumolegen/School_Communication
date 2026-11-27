import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { RelationshipType } from '@shared/enums';
import { IsDateOnlyString } from '@shared/validators/is-date-string-only.validator';
import { IsPhoneNumberString } from '@shared/validators/is-phone.validator';

export class CreateStudentDto {
  @IsString()
  admissionNo!: string;

  @IsString()
  fullName!: string;

  @IsUUID()
  sectionId!: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsOptional()
  @IsDateOnlyString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  rollNo?: string;

  @IsOptional()
  @IsPhoneNumberString()
  guardianPhone?: string;

  @IsOptional()
  @IsString()
  parentFullName?: string;

  @IsOptional()
  @IsEnum(RelationshipType)
  parentRelationship?: RelationshipType;

  @IsOptional()
  @IsString()
  parentPin?: string;

  @IsOptional()
  @IsPhoneNumberString()
  studentLoginPhone?: string;

  @IsOptional()
  @IsString()
  studentPin?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsDateOnlyString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  rollNo?: string;

  @IsOptional()
  @IsPhoneNumberString()
  guardianPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class LinkParentDto {
  @IsPhoneNumberString()
  parentPhone!: string;

  @IsString()
  parentFullName!: string;

  @IsOptional()
  @IsEnum(RelationshipType)
  relationship?: RelationshipType;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  parentPin?: string;
}

export class StudentsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsOptional()
  @IsString()
  schoolId?: string;
}
