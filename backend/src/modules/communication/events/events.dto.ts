import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EventType, TargetScope } from '@shared/enums';
import { IsDateOnlyString } from '@shared/validators/is-date-string-only.validator';

export class CreateEventDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(EventType)
  eventType!: EventType;

  @IsDateOnlyString()
  eventDate!: string;

  @IsOptional()
  @IsDateOnlyString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TargetScope)
  targetScope?: TargetScope;

  @IsOptional()
  @IsUUID()
  sectionId?: string;
}

export class EventsQueryDto {
  @IsOptional()
  @IsString()
  month?: string;

  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @IsOptional()
  @IsUUID()
  studentId?: string;
}
