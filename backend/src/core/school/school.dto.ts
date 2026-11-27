import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { SubscriptionStatus } from '@shared/enums';
import { IsHexColorCode } from '@shared/validators/is-hex-color.validator';
import { IsPhoneNumberString as IsPhone } from '@shared/validators/is-phone.validator';

export class CreateSchoolDto {
  @IsString()
  @MaxLength(20)
  schoolCode!: string;

  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsHexColorCode()
  primaryColor?: string;

  @IsOptional()
  @IsHexColorCode()
  accentColor?: string;

  @IsOptional()
  @IsPhone()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;

  @IsOptional()
  @IsString()
  subscriptionPlan?: string;

  @IsOptional()
  @IsString()
  adminFullName?: string;

  @IsOptional()
  @IsPhone()
  adminPhone?: string;

  @IsOptional()
  @IsString()
  adminPassword?: string;
}

export class UpdateSchoolDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsHexColorCode()
  primaryColor?: string;

  @IsOptional()
  @IsHexColorCode()
  accentColor?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;

  @IsOptional()
  @IsString()
  subscriptionPlan?: string;

  @IsOptional()
  @IsString()
  subscriptionExpiresAt?: string;

  @IsOptional()
  @IsBoolean()
  messagingBroadcastOnly?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  messagingStartHour?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  messagingEndHour?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
