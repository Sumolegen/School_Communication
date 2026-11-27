import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { RoleCode } from '@shared/enums';
import { IsPhoneNumberString } from '@shared/validators/is-phone.validator';

export class RequestOtpDto {
  @IsOptional()
  @IsString()
  schoolCode?: string;

  @IsPhoneNumberString()
  phone!: string;
}

export class VerifyOtpDto {
  @IsOptional()
  @IsString()
  schoolCode?: string;

  @IsPhoneNumberString()
  phone!: string;

  @IsString()
  @Length(4, 8)
  otp!: string;

  @IsOptional()
  @IsString()
  fcmToken?: string;
}

export class LoginDto {
  @IsOptional()
  @IsString()
  schoolCode?: string;

  @IsPhoneNumberString()
  phone!: string;

  @IsString()
  pinOrPassword!: string;

  @IsOptional()
  @IsString()
  fcmToken?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export class RegisterUserDto {
  @IsString()
  schoolCode!: string;

  @IsEnum(RoleCode)
  roleCode!: RoleCode;

  @IsPhoneNumberString()
  phone!: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @Length(4, 32)
  pinOrPassword!: string;

  @IsOptional()
  @IsString()
  fcmToken?: string;
}

export class RegisterSchoolDto {
  @IsString()
  schoolName!: string;

  @IsString()
  schoolCode!: string;

  @IsString()
  adminFullName!: string;

  @IsPhoneNumberString()
  adminPhone!: string;

  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsString()
  @Length(4, 32)
  adminPassword!: string;

  @IsOptional()
  @IsString()
  fcmToken?: string;
}
