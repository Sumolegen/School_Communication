import { IsOptional, IsString, Length } from 'class-validator';
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
