import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { RoleCode } from '@shared/enums';
import { IsPhoneNumberString } from '@shared/validators/is-phone.validator';

export class CreateUserDto {
  @IsPhoneNumberString()
  phone!: string;

  @IsString()
  fullName!: string;

  @IsEnum(RoleCode)
  roleCode!: RoleCode;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  pinOrPassword?: string;

  @IsOptional()
  @IsString()
  schoolId?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  fcmToken?: string;
}

export class UpdateOwnProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  fcmToken?: string;

  @IsOptional()
  @IsString()
  newPinOrPassword?: string;
}

export class UsersQueryDto {
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
  @IsEnum(RoleCode)
  roleCode?: RoleCode;

  @IsOptional()
  @IsString()
  schoolId?: string;
}
