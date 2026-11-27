import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { IsPhoneNumberString } from '@shared/validators/is-phone.validator';

export class CreateStaffDto {
  @IsString()
  fullName!: string;

  @IsPhoneNumberString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  employeeCode!: string;

  @IsString()
  designation!: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsBoolean()
  isTeacher?: boolean;

  @IsOptional()
  @IsString()
  pinOrPassword?: string;
}

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsBoolean()
  isTeacher?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class StaffQueryDto {
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
  @IsBoolean()
  teachersOnly?: boolean;

  @IsOptional()
  @IsString()
  schoolId?: string;
}
